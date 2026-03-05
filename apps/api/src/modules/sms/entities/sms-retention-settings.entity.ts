import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";

@Entity({ name: "sms_retention_settings" })
@Index(["orgId"], { unique: true })
export class SmsRetentionSettings extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "is_enabled", type: "boolean", default: true })
  isEnabled!: boolean;

  @Column({ name: "we_miss_you_enabled", type: "boolean", default: true })
  weMissYouEnabled!: boolean;

  @Column({ name: "next_booking_special_enabled", type: "boolean", default: true })
  nextBookingSpecialEnabled!: boolean;

  @Column({ name: "churn_days", type: "integer", default: 30 })
  churnDays!: number;

  @Column({ name: "last_run_at", type: "timestamptz", nullable: true })
  lastRunAt!: Date | null;
}
