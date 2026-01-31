import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { Membership } from "../identity/entities/membership.entity";
import { RolePermission } from "../identity/entities/role-permission.entity";
import { User } from "../identity/entities/user.entity";
import { MembershipStatus } from "../../common/enums";
import { JwtPayload } from "./types/jwt-payload";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user?.passwordHash) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user : null;
  }

  async login(user: User, orgId?: string): Promise<{ accessToken: string }> {
    const selectedOrgId = orgId || (await this.getDefaultOrgId(user.id));
    if (!selectedOrgId) {
      throw new BadRequestException("orgId is required for login");
    }

    const membership = await this.getActiveMembership(user.id, selectedOrgId);
    if (!membership) {
      throw new UnauthorizedException("No active membership for org");
    }

    const permissions = await this.getUserPermissions(user.id, selectedOrgId);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: selectedOrgId,
      roleId: membership.roleId,
      permissions,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }

  async getUserPermissions(userId: string, orgId: string): Promise<string[]> {
    const rows = await this.rolePermissionRepo
      .createQueryBuilder("rp")
      .innerJoin("rp.role", "role")
      .innerJoin("rp.permission", "permission")
      .innerJoin(
        Membership,
        "membership",
        "membership.role_id = role.id",
      )
      .where("membership.user_id = :userId", { userId })
      .andWhere("membership.org_id = :orgId", { orgId })
      .andWhere("membership.status = :status", {
        status: MembershipStatus.Active,
      })
      .select("permission.key", "key")
      .getRawMany<{ key: string }>();

    return rows.map((row) => row.key);
  }

  private async getDefaultOrgId(userId: string): Promise<string | null> {
    const membership = await this.membershipRepo.findOne({
      where: { userId, status: MembershipStatus.Active },
      order: { createdAt: "ASC" },
    });

    return membership?.orgId ?? null;
  }

  private async getActiveMembership(
    userId: string,
    orgId: string,
  ): Promise<Membership | null> {
    return this.membershipRepo.findOne({
      where: { userId, orgId, status: MembershipStatus.Active },
    });
  }
}
