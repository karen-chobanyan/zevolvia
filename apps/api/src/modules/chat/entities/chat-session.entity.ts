import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";
import { User } from "../../identity/entities/user.entity";
import { ChatMessage } from "./chat-message.entity";
import { Client } from "../../booking/entities/client.entity";

@Entity({ name: "chat_sessions" })
@Index(["orgId", "userId", "updatedAt"])
@Index(["orgId", "source", "updatedAt"])
@Index(["orgId", "source", "externalThreadKey"], {
  unique: true,
  where: `"source" IN ('sms', 'whatsapp', 'telegram') AND "external_thread_key" IS NOT NULL`,
})
export class ChatSession extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ type: "text", default: "web" })
  source!: string;

  @Column({ name: "external_thread_key", type: "text", nullable: true })
  externalThreadKey!: string | null;

  @Column({ name: "client_id", type: "uuid", nullable: true })
  clientId!: string | null;

  @ManyToOne(() => Client, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "client_id" })
  client!: Client | null;

  @Column({ type: "text", nullable: true })
  title!: string | null;

  @OneToMany(() => ChatMessage, (message) => message.session)
  messages!: ChatMessage[];
}
