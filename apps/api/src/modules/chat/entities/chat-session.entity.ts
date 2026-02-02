import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "../../identity/entities/org.entity";
import { User } from "../../identity/entities/user.entity";
import { ChatMessage } from "./chat-message.entity";

@Entity({ name: "chat_sessions" })
@Index(["orgId", "userId", "updatedAt"])
export class ChatSession extends BaseModel {
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

  @Column({ type: "text", nullable: true })
  title!: string | null;

  @OneToMany(() => ChatMessage, (message) => message.session)
  messages!: ChatMessage[];
}
