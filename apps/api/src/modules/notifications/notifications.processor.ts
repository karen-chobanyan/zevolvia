import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { Job, Queue } from "bullmq";
import { Repository } from "typeorm";
import { NotificationStatus } from "../../common/enums";
import { NOTIFICATIONS_DLQ_NAME, NOTIFICATIONS_QUEUE_NAME } from "./constants";
import { Notification } from "./entities/notification.entity";
import { PushSubscription } from "./entities/push-subscription.entity";
import { NotificationTemplateService } from "./notification-template.service";
import { PushDeliveryService } from "./push-delivery.service";
import { NotificationDeadLetterJobData, NotificationJobData } from "./types";

@Processor(NOTIFICATIONS_QUEUE_NAME)
export class NotificationsProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(NotificationsProcessor.name)
    private readonly logger: PinoLogger,
    @InjectQueue(NOTIFICATIONS_DLQ_NAME)
    private readonly deadLetterQueue: Queue<NotificationDeadLetterJobData>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
    private readonly notificationTemplateService: NotificationTemplateService,
    private readonly pushDeliveryService: PushDeliveryService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const currentAttempt = job.attemptsMade + 1;
    const notification = await this.notificationRepository.findOne({
      where: {
        id: job.data.notificationId,
        orgId: job.data.orgId,
      },
    });

    if (!notification) {
      this.logger.warn(
        { jobId: job.id, notificationId: job.data.notificationId, orgId: job.data.orgId },
        "Notification not found for job",
      );
      return;
    }

    await this.notificationRepository.update(
      { id: notification.id, orgId: notification.orgId },
      {
        status: NotificationStatus.Processing,
        attempts: currentAttempt,
        error: null,
      },
    );

    if (!this.pushDeliveryService.isEnabled()) {
      await this.notificationRepository.update(
        { id: notification.id, orgId: notification.orgId },
        {
          status: NotificationStatus.Skipped,
          attempts: currentAttempt,
          error: "Push notifications disabled",
        },
      );
      this.logger.info(
        { jobId: job.id, notificationId: notification.id, orgId: notification.orgId },
        "Skipped notification because push is disabled",
      );
      return;
    }

    const subscriptions = await this.pushSubscriptionRepository.find({
      where: { orgId: notification.orgId },
      order: { createdAt: "ASC" },
    });

    if (!subscriptions.length) {
      await this.notificationRepository.update(
        { id: notification.id, orgId: notification.orgId },
        {
          status: NotificationStatus.Skipped,
          attempts: currentAttempt,
          error: "No push subscriptions registered",
        },
      );
      this.logger.info(
        { jobId: job.id, notificationId: notification.id, orgId: notification.orgId },
        "Skipped notification because no subscriptions were registered",
      );
      return;
    }

    const rendered = this.notificationTemplateService.renderBookingCreatedPush(
      notification.payload,
    );

    try {
      const delivered = await this.pushDeliveryService.sendRenderedNotification(
        notification.orgId,
        rendered,
        subscriptions,
      );

      const status = delivered > 0 ? NotificationStatus.Delivered : NotificationStatus.Skipped;
      const error = delivered > 0 ? null : "No active push subscriptions remained";
      await this.notificationRepository.update(
        { id: notification.id, orgId: notification.orgId },
        {
          status,
          attempts: currentAttempt,
          error,
        },
      );

      this.logger.info(
        {
          jobId: job.id,
          notificationId: notification.id,
          orgId: notification.orgId,
          delivered,
          attempt: currentAttempt,
        },
        "Processed push notification",
      );
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      const isTerminalFailure = currentAttempt >= this.pushDeliveryService.getMaxRetries();

      await this.notificationRepository.update(
        { id: notification.id, orgId: notification.orgId },
        {
          status: isTerminalFailure ? NotificationStatus.DeadLettered : NotificationStatus.Failed,
          attempts: currentAttempt,
          error: errorMessage,
        },
      );

      if (isTerminalFailure) {
        await this.deadLetterQueue.add(
          "dead-letter",
          {
            notificationId: notification.id,
            orgId: notification.orgId,
            event: job.data.event,
            attempt: currentAttempt,
            error: errorMessage,
          },
          {
            removeOnComplete: 100,
            removeOnFail: 100,
          },
        );
      }

      throw error;
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job<NotificationJobData>): void {
    this.logger.info(
      { jobId: job.id, notificationId: job.data.notificationId, orgId: job.data.orgId },
      "Notification job completed",
    );
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job<NotificationJobData> | undefined, error: Error): void {
    if (!job) {
      this.logger.error({ error: this.serializeError(error) }, "Notification job failed");
      return;
    }

    this.logger.error(
      {
        jobId: job.id,
        notificationId: job.data.notificationId,
        orgId: job.data.orgId,
        attempt: job.attemptsMade,
        error: this.serializeError(error),
      },
      "Notification job failed",
    );
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown notification processing error";
  }

  private serializeError(error: Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
}
