import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { SubscriptionStatus } from "../../../common/enums";
import { Org } from "../../identity/entities/org.entity";

@Entity({ name: "billing_subscriptions" })
@Index(["orgId"], { unique: true })
@Index(["customerId"])
@Index(["subscriptionId"])
@Index(["status", "trialEnd"])
export class BillingSubscription extends BaseModel {
  @Column({ name: "org_id", type: "uuid", unique: true })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ type: "text", default: "stripe" })
  provider!: string;

  @Column({ name: "customer_id", type: "text", nullable: true })
  customerId!: string | null;

  @Column({ name: "subscription_id", type: "text", nullable: true, unique: true })
  subscriptionId!: string | null;

  @Column({ name: "subscription_item_id", type: "text", nullable: true })
  subscriptionItemId!: string | null;

  @Column({ type: "text", default: SubscriptionStatus.Trialing })
  status!: SubscriptionStatus;

  @Column({ name: "price_id", type: "text", nullable: true })
  priceId!: string | null;

  @Column({ type: "integer", default: 1 })
  quantity!: number;

  @Column({ name: "current_period_start", type: "timestamptz", nullable: true })
  currentPeriodStart!: Date | null;

  @Column({ name: "current_period_end", type: "timestamptz", nullable: true })
  currentPeriodEnd!: Date | null;

  @Column({ name: "trial_start", type: "timestamptz", nullable: true })
  trialStart!: Date | null;

  @Column({ name: "trial_end", type: "timestamptz", nullable: true })
  trialEnd!: Date | null;

  @Column({ name: "trial_converted_at", type: "timestamptz", nullable: true })
  trialConvertedAt!: Date | null;

  @Column({ name: "canceled_at", type: "timestamptz", nullable: true })
  canceledAt!: Date | null;

  @Column({ name: "ended_at", type: "timestamptz", nullable: true })
  endedAt!: Date | null;

  @Column({ name: "cancel_at_period_end", type: "boolean", default: false })
  cancelAtPeriodEnd!: boolean;
}
