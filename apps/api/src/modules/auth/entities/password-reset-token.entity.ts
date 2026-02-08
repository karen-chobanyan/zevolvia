import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { User } from "../../identity/entities/user.entity";
import { Org } from "../../identity/entities/org.entity";

@Entity({ name: "password_reset_tokens" })
@Index(["tokenHash"], { unique: true })
@Index(["orgId", "userId", "expiresAt"])
export class PasswordResetToken extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "token_hash", type: "text" })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "used_at", type: "timestamptz", nullable: true })
  usedAt!: Date | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Org, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org!: Org;
}
