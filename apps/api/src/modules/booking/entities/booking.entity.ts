import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { BookingStatus } from "../../../common/enums";
import { Org } from "../../identity/entities/org.entity";
import { User } from "../../identity/entities/user.entity";
import { Client } from "./client.entity";
import { Service } from "./service.entity";

@Entity({ name: "bookings" })
@Index(["orgId"])
@Index(["staffId", "startTime"])
@Index(["orgId", "status"])
@Index(["orgId", "startTime", "endTime"])
export class Booking extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId!: string | null;

  @ManyToOne(() => Client, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "client_id" })
  client!: Client | null;

  @Column({ name: "staff_id", type: "uuid" })
  staffId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "staff_id" })
  staff!: User;

  @Column({ name: "service_id", type: "uuid" })
  serviceId!: string;

  @ManyToOne(() => Service, { onDelete: "CASCADE" })
  @JoinColumn({ name: "service_id" })
  service!: Service;

  @Column({ name: "start_time", type: "timestamptz" })
  startTime!: Date;

  @Column({ name: "end_time", type: "timestamptz" })
  endTime!: Date;

  @Column({ type: "text", default: BookingStatus.Scheduled })
  status!: BookingStatus;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "client_name", type: "text", nullable: true })
  clientName!: string | null; // For walk-ins without a client record
}
