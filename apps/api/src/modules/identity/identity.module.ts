import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Membership } from "./entities/membership.entity";
import { Org } from "./entities/org.entity";
import { Permission } from "./entities/permission.entity";
import { RolePermission } from "./entities/role-permission.entity";
import { Role } from "./entities/role.entity";
import { User } from "./entities/user.entity";
import { Invite } from "./entities/invite.entity";
import { OrgService } from "./services/org.service";
import { OrgController } from "./controllers/org.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Org, User, Role, Permission, RolePermission, Membership, Invite]),
    forwardRef(() => AuthModule),
  ],
  controllers: [OrgController],
  providers: [OrgService],
  exports: [TypeOrmModule, OrgService],
})
export class IdentityModule {}
