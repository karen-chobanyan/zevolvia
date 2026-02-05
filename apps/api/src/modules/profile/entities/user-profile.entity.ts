import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { User } from "../../identity/entities/user.entity";

@Entity({ name: "user_profiles" })
@Index(["userId"], { unique: true })
export class UserProfile extends BaseModel {
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "first_name", type: "text", nullable: true })
  firstName!: string | null;

  @Column({ name: "last_name", type: "text", nullable: true })
  lastName!: string | null;

  @Column({ type: "text", nullable: true })
  phone!: string | null;

  @Column({ name: "avatar_url", type: "text", nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "text", nullable: true })
  locale!: string | null;

  @Column({ name: "time_zone", type: "text", nullable: true })
  timeZone!: string | null;
}
