import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";
import { Client } from "../../booking/entities/client.entity";

@Entity({ name: "sms_messages" })
@Index(["orgId", "createdAt"])
@Index(["messageSid"], { unique: true })
export class SmsMessage extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "from_number", type: "text" })
  fromNumber!: string;

  @Column({ name: "to_number", type: "text" })
  toNumber!: string;

  @Column({ type: "text", default: "sms" })
  channel!: "sms" | "whatsapp" | "telegram";

  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId!: string | null;

  @ManyToOne(() => Client, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "client_id" })
  client!: Client | null;

  @Column({ type: "text" })
  body!: string;

  @Column({ name: "message_sid", type: "text" })
  messageSid!: string;

  @Column({ name: "account_sid", type: "text" })
  accountSid!: string;

  @Column({ name: "messaging_service_sid", type: "text", nullable: true })
  messagingServiceSid!: string | null;

  @Column({ name: "sms_status", type: "text", nullable: true })
  smsStatus!: string | null;

  @Column({ type: "text", default: "inbound" })
  direction!: "inbound" | "outbound";

  @Column({ name: "response_to_message_sid", type: "text", nullable: true })
  responseToMessageSid!: string | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage!: string | null;

  @Column({ name: "num_media", type: "integer", default: 0 })
  numMedia!: number;

  @Column({ name: "media", type: "jsonb", nullable: true })
  media!: Array<{ url: string; contentType?: string }> | null;

  @Column({ name: "raw_payload", type: "jsonb" })
  rawPayload!: Record<string, unknown>;
}
