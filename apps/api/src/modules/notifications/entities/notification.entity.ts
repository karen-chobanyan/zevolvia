import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { NotificationChannel, NotificationStatus } from "../../../common/enums";
import { Booking } from "../../booking/entities/booking.entity";
import { Org } from "../../identity/entities/org.entity";
import { BookingCreatedNotificationPayload } from "../types";

@Entity({ name: "notification_deliveries" })
@Index(["orgId", "status"])
@Index(["bookingId"])
@Index(["orgId", "createdAt"])
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "booking_id", type: "uuid" })
  bookingId!: string;

  @ManyToOne(() => Booking, { onDelete: "CASCADE" })
  @JoinColumn({ name: "booking_id" })
  booking!: Booking;

  @Column({ type: "text" })
  channel!: NotificationChannel;

  @Column({ type: "text", default: NotificationStatus.Pending })
  status!: NotificationStatus;

  @Column({ type: "jsonb" })
  payload!: BookingCreatedNotificationPayload;

  @Column({ type: "integer", default: 0 })
  attempts!: number;

  @Column({ type: "text", nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
