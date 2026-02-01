import { Column, Entity, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Membership } from "./membership.entity";

@Entity({ name: "users" })
export class User extends BaseModel {
  @Column({ type: "text", unique: true })
  email!: string;

  @Column({ type: "text", nullable: true })
  name!: string | null;

  @Column({ name: "password_hash", type: "text", nullable: true })
  passwordHash!: string | null;

  @OneToMany(() => Membership, (membership) => membership.user)
  memberships!: Membership[];
}
