import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { File } from "../files/entities/file.entity";
import { Document } from "../knowledge/entities/document.entity";
import { Chunk } from "../knowledge/entities/chunk.entity";
import { Embedding } from "../knowledge/entities/embedding.entity";
import { KnowledgeBase } from "../knowledge/entities/knowledge-base.entity";
import { FilesModule } from "../files/files.module";
import { IngestionService } from "./ingestion.service";
import { IngestionProcessor } from "./ingestion.processor";
import { TextExtractorService } from "./services/text-extractor.service";
import { ChunkerService } from "./services/chunker.service";
import { EmbeddingService } from "./services/embedding.service";

const QUEUE_NAME = "file-ingestion";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST") || "localhost",
          port: parseInt(configService.get<string>("REDIS_PORT") || "6379", 10),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUEUE_NAME,
    }),
    TypeOrmModule.forFeature([File, Document, Chunk, Embedding, KnowledgeBase]),
    FilesModule,
  ],
  providers: [
    IngestionService,
    IngestionProcessor,
    TextExtractorService,
    ChunkerService,
    EmbeddingService,
  ],
  exports: [IngestionService, EmbeddingService],
})
export class IngestionModule {}
