import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { IngestionService } from "./ingestion.service";
import { IngestionJobData } from "./dto/ingestion-job.dto";

const QUEUE_NAME = "file-ingestion";

@Processor(QUEUE_NAME)
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private readonly ingestionService: IngestionService) {
    super();
  }

  async process(job: Job<IngestionJobData>): Promise<void> {
    const { fileId, orgId } = job.data;
    this.logger.log(`Processing ingestion job for file ${fileId}`);

    await this.ingestionService.processFile(fileId, orgId);
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job<IngestionJobData>): void {
    this.logger.log(`Job ${job.id} completed for file ${job.data.fileId}`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job<IngestionJobData> | undefined, error: Error): void {
    if (job) {
      this.logger.error(
        `Job ${job.id} failed for file ${job.data.fileId}: ${error.message}`,
        error.stack,
      );
    } else {
      this.logger.error(`Job failed: ${error.message}`, error.stack);
    }
  }
}
