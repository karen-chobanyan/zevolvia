import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { ChatRole } from "../../../common/enums";
import { ChatSession } from "./chat-session.entity";

@Entity({ name: "chat_messages" })
@Index(["sessionId", "createdAt"])
export class ChatMessage extends BaseModel {
  @Column({ name: "session_id", type: "uuid" })
  sessionId!: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "session_id" })
  session!: ChatSession;

  @Column({ type: "text" })
  role!: ChatRole;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;
}
