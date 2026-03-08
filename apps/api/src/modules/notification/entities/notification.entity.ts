import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";
import { User } from "../../identity/entities/user.entity";
import { Booking } from "../../booking/entities/booking.entity";

@Entity({ name: "notifications" })
@Index(["orgId", "userId"])
@Index(["orgId", "createdAt"])
export class Notification extends BaseModel {
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

  @Column({ name: "booking_id", type: "uuid", nullable: true })
  bookingId!: string | null;

  @ManyToOne(() => Booking, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "booking_id" })
  booking!: Booking | null;

  @Column({ type: "text" })
  type!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "jsonb", nullable: true })
  data!: Record<string, unknown> | null;

  @Column({ name: "read_at", type: "timestamptz", nullable: true })
  readAt!: Date | null;
}
