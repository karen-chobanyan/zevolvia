import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Membership } from "../identity/entities/membership.entity";
import { Org } from "../identity/entities/org.entity";
import { Role } from "../identity/entities/role.entity";
import { User } from "../identity/entities/user.entity";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { UserProfile } from "./entities/user-profile.entity";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, UserProfile, Org, Membership, Role])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
