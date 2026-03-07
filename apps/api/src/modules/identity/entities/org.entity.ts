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

  @Column({ type: "text", nullable: true })
  phone!: string | null;

  @Column({ type: "text", default: "US" })
  country!: string;

  @Column({ name: "time_zone", type: "text", nullable: true })
  timeZone!: string | null;

  @Column({ name: "working_hours_start", type: "time", default: "09:00" })
  workingHoursStart!: string;

  @Column({ name: "working_hours_end", type: "time", default: "20:00" })
  workingHoursEnd!: string;

  @OneToMany(() => Membership, (membership) => membership.org)
  memberships!: Membership[];

  @OneToMany(() => Role, (role) => role.org)
  roles!: Role[];
}
