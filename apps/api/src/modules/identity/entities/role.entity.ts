import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Org } from "./org.entity";
import { RolePermission } from "./role-permission.entity";

@Entity({ name: "roles" })
@Index(["orgId", "name"], { unique: true })
export class Role extends BaseModel {
  @Column({ name: "org_id", type: "uuid" })
  orgId: string;

  @ManyToOne(() => Org, (org) => org.roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "org_id" })
  org: Org;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "is_system", type: "boolean", default: false })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}
