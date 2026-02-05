import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";

@Entity({ name: "clients" })
@Index(["orgId"])
@Index(["orgId", "email"])
@Index(["orgId", "name"])
export class Client extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", nullable: true })
  email!: string | null;

  @Column({ type: "text", nullable: true })
  phone!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "is_walk_in", type: "boolean", default: false })
  isWalkIn!: boolean;
}
