import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "./org.entity";
import { Role } from "./role.entity";
import { User } from "./user.entity";

export enum InviteStatus {
  Pending = "pending",
  Accepted = "accepted",
  Cancelled = "cancelled",
  Expired = "expired",
}

@Entity({ name: "invites" })
@Index(["orgId", "email"])
@Index(["token"], { unique: true })
export class Invite extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "text", nullable: true })
  name!: string | null;

  @Column({ type: "text", nullable: true })
  phone!: string | null;

  @Column({ name: "role_id", type: "uuid" })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @Column({ name: "invited_by_id", type: "uuid" })
  invitedById!: string;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "invited_by_id" })
  invitedBy!: User | null;

  @Column({ type: "text", unique: true })
  token!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ type: "text", default: InviteStatus.Pending })
  status!: InviteStatus;
}
