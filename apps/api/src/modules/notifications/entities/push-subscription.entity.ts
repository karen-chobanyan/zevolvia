import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";
import { User } from "../../identity/entities/user.entity";

@Entity({ name: "push_subscriptions" })
@Index(["orgId"])
@Index(["orgId", "userId"])
@Index(["orgId", "endpoint"], { unique: true })
export class PushSubscription extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ type: "text" })
  endpoint!: string;

  @Column({ type: "text" })
  p256dh!: string;

  @Column({ type: "text" })
  auth!: string;

  @Column({ name: "expiration_time", type: "bigint", nullable: true })
  expirationTime!: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent!: string | null;
}
