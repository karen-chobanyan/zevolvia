import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Document } from "./document.entity";
import { Embedding } from "./embedding.entity";

@Entity({ name: "chunks" })
@Index(["documentId", "idx"], { unique: true })
@Index(["orgId"])
export class Chunk extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId: string;

  @Column({ name: "document_id", type: "uuid" })
  documentId: string;

  @ManyToOne(() => Document, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document: Document;

  @Column({ type: "int" })
  idx: number;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "int", nullable: true })
  tokens: number | null;

  @OneToOne(() => Embedding, (embedding) => embedding.chunk)
  embedding: Embedding;
}
