import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { FileStatus, FileRagStatus } from "../../../common/enums";
import { Org } from "../../identity/entities/org.entity";
import { User } from "../../identity/entities/user.entity";
import { KnowledgeBase } from "../../knowledge/entities/knowledge-base.entity";
import { Folder } from "../../file-manager/entities/folder.entity";

@Entity({ name: "files" })
@Index(["orgId", "status"])
@Index(["orgId", "knowledgeBaseId"])
@Index(["storageKey"], { unique: true })
@Index(["folderId"])
export class File extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "knowledge_base_id", type: "uuid", nullable: true })
  knowledgeBaseId!: string | null;

  @ManyToOne(() => KnowledgeBase, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "knowledge_base_id" })
  knowledgeBase!: KnowledgeBase | null;

  @Column({ name: "folder_id", type: "uuid", nullable: true })
  folderId!: string | null;

  @ManyToOne(() => Folder, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "folder_id" })
  folder!: Folder | null;

  @Column({ name: "uploaded_by_id", type: "uuid", nullable: true })
  uploadedById!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "uploaded_by_id" })
  uploadedBy!: User | null;

  @Column({ type: "text" })
  bucket!: string;

  @Column({ name: "storage_key", type: "text" })
  storageKey!: string;

  @Column({ name: "original_name", type: "text" })
  originalName!: string;

  @Column({ name: "mime_type", type: "text" })
  mimeType!: string;

  @Column({ type: "bigint" })
  size!: number;

  @Column({ type: "text", nullable: true })
  checksum!: string | null;

  @Column({ type: "text", default: FileStatus.Uploaded })
  status!: FileStatus;

  @Column({ name: "rag_status", type: "text", default: FileRagStatus.Pending })
  ragStatus!: FileRagStatus;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage!: string | null;
}
