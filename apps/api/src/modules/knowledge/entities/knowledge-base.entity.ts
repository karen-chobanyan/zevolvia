import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";
import { Document } from "./document.entity";

@Entity({ name: "knowledge_bases" })
@Index(["orgId", "name"], { unique: true })
export class KnowledgeBase extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ type: "text" })
  name!: string;

  @OneToMany(() => Document, (document) => document.knowledgeBase)
  documents!: Document[];
}
