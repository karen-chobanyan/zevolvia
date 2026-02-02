import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { Job } from "bullmq";
import { IngestionService } from "./ingestion.service";
import { IngestionJobData } from "./dto/ingestion-job.dto";

const QUEUE_NAME = "file-ingestion";

@Processor(QUEUE_NAME)
export class IngestionProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(IngestionProcessor.name)
    private readonly logger: PinoLogger,
    private readonly ingestionService: IngestionService,
  ) {
    super();
  }

  async process(job: Job<IngestionJobData>): Promise<void> {
    const { fileId, orgId } = job.data;
    this.logger.info(
      { jobId: job.id, fileId, orgId, attempt: job.attemptsMade + 1 },
      "Processing ingestion job",
    );

    await this.ingestionService.processFile(fileId, orgId);
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job<IngestionJobData>): void {
    this.logger.info(
      { jobId: job.id, fileId: job.data.fileId, orgId: job.data.orgId },
      "Ingestion job completed",
    );
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job<IngestionJobData> | undefined, error: Error): void {
    if (job) {
      this.logger.error(
        {
          jobId: job.id,
          fileId: job.data.fileId,
          orgId: job.data.orgId,
          attempt: job.attemptsMade,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
        },
        "Ingestion job failed",
      );
    } else {
      this.logger.error(
        {
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack,
          },
        },
        "Ingestion job failed (no job context)",
      );
    }
  }
}
