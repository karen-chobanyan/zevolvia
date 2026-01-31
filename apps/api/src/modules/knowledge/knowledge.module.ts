import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Chunk } from "./entities/chunk.entity";
import { Document } from "./entities/document.entity";
import { Embedding } from "./entities/embedding.entity";
import { KnowledgeBase } from "./entities/knowledge-base.entity";

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeBase, Document, Chunk, Embedding])],
  exports: [TypeOrmModule],
})
export class KnowledgeModule {}
