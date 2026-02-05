import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";

@Entity({ name: "services" })
@Index(["orgId"])
@Index(["orgId", "isActive"])
export class Service extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "duration_minutes", type: "integer", default: 30 })
  durationMinutes!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: "text", default: "#3b82f6" })
  color!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;
}
