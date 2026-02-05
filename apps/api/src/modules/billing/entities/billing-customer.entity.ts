import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Org } from "../../identity/entities/org.entity";

@Entity({ name: "billing_customers" })
export class BillingCustomer {
  @PrimaryColumn({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ type: "text", default: "stripe" })
  provider!: string;

  @Column({ name: "customer_id", type: "text", unique: true })
  customerId!: string;
}
