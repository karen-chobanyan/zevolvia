import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { Queue } from "bullmq";
import { Repository } from "typeorm";
import { Booking } from "../booking/entities/booking.entity";
import { NotificationChannel, NotificationStatus } from "../../common/enums";
import {
  BOOKING_CREATED_EVENT,
  DEFAULT_NOTIFICATION_BACKOFF_MS,
  DEFAULT_NOTIFICATION_MAX_RETRIES,
  NOTIFICATIONS_QUEUE_NAME,
} from "./constants";
import { Notification } from "./entities/notification.entity";
import { BookingCreatedNotificationPayload, NotificationJobData } from "./types";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectPinoLogger(NotificationsService.name)
    private readonly logger: PinoLogger,
    @InjectQueue(NOTIFICATIONS_QUEUE_NAME)
    private readonly notificationsQueue: Queue<NotificationJobData>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
  ) {}

  async queueBookingCreated(booking: Booking, timeZone: string | null): Promise<Notification> {
    const payload = this.buildBookingCreatedPayload(booking, timeZone);
    const notification = this.notificationRepository.create({
      orgId: booking.orgId,
      bookingId: booking.id,
      channel: NotificationChannel.WebPush,
      status: NotificationStatus.Pending,
      payload,
      attempts: 0,
      error: null,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    try {
      await this.notificationsQueue.add(
        BOOKING_CREATED_EVENT,
        {
          notificationId: savedNotification.id,
          orgId: booking.orgId,
          event: BOOKING_CREATED_EVENT,
        },
        {
          attempts: this.getMaxRetries(),
          backoff: {
            type: "exponential",
            delay: DEFAULT_NOTIFICATION_BACKOFF_MS,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );

      this.logger.info(
        { notificationId: savedNotification.id, bookingId: booking.id, orgId: booking.orgId },
        "Queued booking-created notification",
      );
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      await this.notificationRepository.update(
        { id: savedNotification.id, orgId: booking.orgId },
        { status: NotificationStatus.Failed, error: errorMessage },
      );
      this.logger.error(
        {
          notificationId: savedNotification.id,
          bookingId: booking.id,
          orgId: booking.orgId,
          error: errorMessage,
        },
        "Failed to enqueue booking-created notification",
      );
    }

    return savedNotification;
  }

  private buildBookingCreatedPayload(
    booking: Booking,
    timeZone: string | null,
  ): BookingCreatedNotificationPayload {
    return {
      event: BOOKING_CREATED_EVENT,
      bookingId: booking.id,
      orgId: booking.orgId,
      channel: NotificationChannel.WebPush,
      clientName: booking.client?.name?.trim() || booking.clientName?.trim() || "Walk-in client",
      staffName: booking.staff?.name?.trim() || "Staff member",
      serviceName: booking.service?.name?.trim() || "Service",
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      timeZone,
    };
  }

  private getMaxRetries(): number {
    const value = this.configService.get<string>("PUSH_NOTIFICATION_MAX_RETRIES");
    const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
    return DEFAULT_NOTIFICATION_MAX_RETRIES;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown notification queue error";
  }
}
