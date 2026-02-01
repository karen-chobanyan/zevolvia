import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Chunk } from "./chunk.entity";

@Entity({ name: "embeddings" })
@Index(["orgId"])
export class Embedding extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "chunk_id", type: "uuid", unique: true })
  chunkId!: string;

  @OneToOne(() => Chunk, (chunk) => chunk.embedding, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chunk_id" })
  chunk!: Chunk;

  @Column({ type: "vector" })
  vector!: number[];
}
