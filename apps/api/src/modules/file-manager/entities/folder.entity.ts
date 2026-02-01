import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";

@Entity({ name: "folders" })
@Index(["orgId", "parentId"])
export class Folder extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId!: string | null;

  @ManyToOne(() => Folder, (folder) => folder.children, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "parent_id" })
  parent!: Folder | null;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children!: Folder[];

  @Column({ type: "text" })
  name!: string;
}
