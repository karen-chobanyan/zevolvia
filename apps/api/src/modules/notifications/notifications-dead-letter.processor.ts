import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { Job } from "bullmq";
import { NOTIFICATIONS_DLQ_NAME } from "./constants";
import { NotificationDeadLetterJobData } from "./types";

@Processor(NOTIFICATIONS_DLQ_NAME)
export class NotificationsDeadLetterProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(NotificationsDeadLetterProcessor.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async process(job: Job<NotificationDeadLetterJobData>): Promise<void> {
    this.logger.error(
      {
        jobId: job.id,
        notificationId: job.data.notificationId,
        orgId: job.data.orgId,
        attempt: job.data.attempt,
        error: job.data.error,
      },
      "Notification moved to dead-letter queue",
    );
  }
}
