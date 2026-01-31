import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Membership } from "./entities/membership.entity";
import { Org } from "./entities/org.entity";
import { Permission } from "./entities/permission.entity";
import { RolePermission } from "./entities/role-permission.entity";
import { Role } from "./entities/role.entity";
import { User } from "./entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Org,
      User,
      Role,
      Permission,
      RolePermission,
      Membership,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class IdentityModule {}
