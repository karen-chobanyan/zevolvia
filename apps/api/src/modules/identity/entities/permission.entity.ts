import { Column, Entity, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { RolePermission } from "./role-permission.entity";

@Entity({ name: "permissions" })
export class Permission extends BaseModel {
  @Column({ type: "text", unique: true })
  key: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];
}
