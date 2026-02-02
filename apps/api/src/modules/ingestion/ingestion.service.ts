import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { Queue } from "bullmq";
import { Repository, DataSource } from "typeorm";
import { Readable } from "stream";
import { File } from "../files/entities/file.entity";
import { Document } from "../knowledge/entities/document.entity";
import { Chunk } from "../knowledge/entities/chunk.entity";
import { Embedding } from "../knowledge/entities/embedding.entity";
import { KnowledgeBase } from "../knowledge/entities/knowledge-base.entity";
import { MinioService } from "../files/services/minio.service";
import { TextExtractorService } from "./services/text-extractor.service";
import { ChunkerService } from "./services/chunker.service";
import { EmbeddingService } from "./services/embedding.service";
import { IngestionJobData } from "./dto/ingestion-job.dto";
import {
  FileRagStatus,
  DocumentStatus,
  DocumentSourceType,
  ALLOWED_FILE_TYPES,
} from "../../common/enums";

const DEFAULT_KB_NAME = "Uploads";
const QUEUE_NAME = "file-ingestion";

@Injectable()
export class IngestionService {
  constructor(
    @InjectPinoLogger(IngestionService.name)
    private readonly logger: PinoLogger,
    @InjectQueue(QUEUE_NAME) private readonly ingestionQueue: Queue<IngestionJobData>,
    @InjectRepository(File) private readonly fileRepository: Repository<File>,
    @InjectRepository(Document) private readonly documentRepository: Repository<Document>,
    @InjectRepository(Chunk) private readonly chunkRepository: Repository<Chunk>,
    @InjectRepository(Embedding) private readonly embeddingRepository: Repository<Embedding>,
    @InjectRepository(KnowledgeBase)
    private readonly knowledgeBaseRepository: Repository<KnowledgeBase>,
    private readonly dataSource: DataSource,
    private readonly minioService: MinioService,
    private readonly textExtractor: TextExtractorService,
    private readonly chunker: ChunkerService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async queueIngestion(fileId: string, orgId: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, orgId },
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    if (!this.isSupportedFileType(file.mimeType)) {
      await this.fileRepository.update({ id: fileId }, { ragStatus: FileRagStatus.Skipped });
      this.logger.info(
        { fileId, orgId, mimeType: file.mimeType },
        "File skipped: unsupported file type",
      );
      return;
    }

    await this.fileRepository.update({ id: fileId }, { ragStatus: FileRagStatus.Queued });

    await this.ingestionQueue.add(
      "ingest",
      { fileId, orgId },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    this.logger.info({ fileId, orgId, fileName: file.originalName }, "File queued for ingestion");
  }

  async processFile(fileId: string, orgId: string): Promise<void> {
    const startTime = Date.now();
    this.logger.info({ fileId, orgId }, "Starting file processing");

    const file = await this.fileRepository.findOne({
      where: { id: fileId, orgId },
    });

    if (!file) {
      this.logger.warn({ fileId, orgId }, "File not found for processing");
      throw new NotFoundException("File not found");
    }

    await this.fileRepository.update({ id: fileId }, { ragStatus: FileRagStatus.Ingesting });

    try {
      this.logger.debug({ fileId, storageKey: file.storageKey }, "Fetching file from storage");
      const stream = await this.minioService.getObject(file.storageKey);
      const buffer = await this.streamToBuffer(stream);
      this.logger.debug({ fileId, size: buffer.length }, "File fetched from storage");

      this.logger.debug({ fileId, mimeType: file.mimeType }, "Extracting text from file");
      const text = await this.textExtractor.extract(buffer, file.mimeType);
      if (!text || text.trim().length === 0) {
        throw new Error("No text content extracted from file");
      }
      this.logger.debug({ fileId, textLength: text.length }, "Text extracted");

      this.logger.debug({ fileId }, "Chunking text");
      const chunks = this.chunker.chunk(text);
      if (chunks.length === 0) {
        throw new Error("No chunks generated from text");
      }
      this.logger.debug({ fileId, chunkCount: chunks.length }, "Text chunked");

      this.logger.debug({ fileId, chunkCount: chunks.length }, "Generating embeddings");
      const embeddings = await this.embeddingService.generateEmbeddings(
        chunks.map((c) => c.content),
      );
      this.logger.debug({ fileId, embeddingCount: embeddings.length }, "Embeddings generated");

      this.logger.debug({ fileId }, "Persisting results to database");
      await this.persistResults(file, chunks, embeddings);

      await this.fileRepository.update(
        { id: fileId },
        { ragStatus: FileRagStatus.Indexed, errorMessage: null },
      );

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          fileId,
          orgId,
          fileName: file.originalName,
          chunkCount: chunks.length,
          duration,
        },
        "File successfully indexed",
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      this.logger.error(
        {
          fileId,
          orgId,
          duration,
          error: {
            message: errorMessage,
            name: (error as Error).name,
            stack: (error as Error).stack,
          },
        },
        "Failed to process file",
      );

      await this.fileRepository.update(
        { id: fileId },
        { ragStatus: FileRagStatus.Failed, errorMessage },
      );

      throw error;
    }
  }

  private async persistResults(
    file: File,
    chunks: Array<{ content: string; idx: number; tokens: number }>,
    embeddings: number[][],
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let knowledgeBaseId = file.knowledgeBaseId;

      if (!knowledgeBaseId) {
        const defaultKb = await this.getOrCreateDefaultKnowledgeBase(file.orgId, queryRunner);
        knowledgeBaseId = defaultKb.id;

        await queryRunner.manager.update(File, { id: file.id }, { knowledgeBaseId });
      }

      const document = queryRunner.manager.create(Document, {
        orgId: file.orgId,
        knowledgeBaseId,
        name: file.originalName,
        sourceType: DocumentSourceType.Upload,
        sourceUri: file.storageKey,
        status: DocumentStatus.Ready,
      });
      const savedDocument = await queryRunner.manager.save(Document, document);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = queryRunner.manager.create(Chunk, {
          orgId: file.orgId,
          documentId: savedDocument.id,
          idx: chunks[i].idx,
          content: chunks[i].content,
          tokens: chunks[i].tokens,
        });
        const savedChunk = await queryRunner.manager.save(Chunk, chunk);

        const embedding = queryRunner.manager.create(Embedding, {
          orgId: file.orgId,
          chunkId: savedChunk.id,
          vector: embeddings[i],
        });
        await queryRunner.manager.save(Embedding, embedding);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getOrCreateDefaultKnowledgeBase(
    orgId: string,
    queryRunner: ReturnType<DataSource["createQueryRunner"]>,
  ): Promise<KnowledgeBase> {
    let knowledgeBase = await queryRunner.manager.findOne(KnowledgeBase, {
      where: { orgId, name: DEFAULT_KB_NAME },
    });

    if (!knowledgeBase) {
      knowledgeBase = queryRunner.manager.create(KnowledgeBase, {
        orgId,
        name: DEFAULT_KB_NAME,
      });
      knowledgeBase = await queryRunner.manager.save(KnowledgeBase, knowledgeBase);
    }

    return knowledgeBase;
  }

  private isSupportedFileType(mimeType: string): boolean {
    return (ALLOWED_FILE_TYPES as readonly string[]).includes(mimeType);
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
