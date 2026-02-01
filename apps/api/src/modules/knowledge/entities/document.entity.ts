import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { DocumentSourceType, DocumentStatus } from "../../../common/enums";
import { KnowledgeBase } from "./knowledge-base.entity";

@Entity({ name: "documents" })
@Index(["orgId", "knowledgeBaseId"])
export class Document extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "knowledge_base_id", type: "uuid" })
  knowledgeBaseId!: string;

  @ManyToOne(() => KnowledgeBase, (knowledgeBase) => knowledgeBase.documents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "knowledge_base_id" })
  knowledgeBase!: KnowledgeBase;

  @Column({ type: "text" })
  name!: string;

  @Column({ name: "source_type", type: "text" })
  sourceType!: DocumentSourceType;

  @Column({ name: "source_uri", type: "text", nullable: true })
  sourceUri!: string | null;

  @Column({ type: "text", default: DocumentStatus.Pending })
  status!: DocumentStatus;
}
