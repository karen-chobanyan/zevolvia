import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { MembershipStatus } from "../../../common/enums";
import { Org } from "./org.entity";
import { Role } from "./role.entity";
import { User } from "./user.entity";

@Entity({ name: "memberships" })
@Index(["orgId", "userId"], { unique: true })
export class Membership extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "role_id", type: "uuid" })
  roleId!: string;

  @ManyToOne(() => Org, (org) => org.memberships, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Role, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @Column({ type: "text", default: MembershipStatus.Active })
  status!: MembershipStatus;
}
