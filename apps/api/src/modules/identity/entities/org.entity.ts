import { Column, Entity, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Membership } from "./membership.entity";
import { Role } from "./role.entity";

@Entity({ name: "orgs" })
export class Org extends BaseModel {
  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", unique: true })
  slug!: string;

  @OneToMany(() => Membership, (membership) => membership.org)
  memberships!: Membership[];

  @OneToMany(() => Role, (role) => role.org)
  roles!: Role[];
}
