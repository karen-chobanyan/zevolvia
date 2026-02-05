import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";
import { User } from "../../identity/entities/user.entity";

@Entity({ name: "staff_availability" })
@Index(["orgId", "userId"])
@Index(["orgId", "userId", "dayOfWeek"], { unique: true })
export class StaffAvailability extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "day_of_week", type: "integer" })
  dayOfWeek!: number; // 0 = Sunday, 6 = Saturday

  @Column({ name: "start_time", type: "time" })
  startTime!: string;

  @Column({ name: "end_time", type: "time" })
  endTime!: string;

  @Column({ name: "is_available", type: "boolean", default: true })
  isAvailable!: boolean;
}
