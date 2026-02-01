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
import { Org } from "../identity/entities/org.entity";
import { Role } from "../identity/entities/role.entity";
import { RolePermission } from "../identity/entities/role-permission.entity";
import { User } from "../identity/entities/user.entity";
import { MembershipStatus } from "../../common/enums";
import { JwtPayload } from "./types/jwt-payload";

type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  orgName?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepo.findOne({ where: { email: normalizedEmail } });
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

  async register(input: RegisterInput): Promise<User> {
    const email = input.email?.trim().toLowerCase();
    if (!email || !input.password) {
      throw new BadRequestException("Email and password are required");
    }

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const name = [input.firstName, input.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || null;
    const orgName = input.orgName?.trim() || name || "SalonIQ Workspace";

    return this.userRepo.manager.transaction(async (manager) => {
      const orgRepo = manager.withRepository(this.orgRepo);
      const roleRepo = manager.withRepository(this.roleRepo);
      const userRepo = manager.withRepository(this.userRepo);
      const membershipRepo = manager.withRepository(this.membershipRepo);

      const slug = await this.createUniqueSlug(orgName, orgRepo);
      const org = orgRepo.create({ name: orgName, slug });
      await orgRepo.save(org);

      const user = userRepo.create({ email, name, passwordHash });
      await userRepo.save(user);

      const role = roleRepo.create({
        orgId: org.id,
        name: "Owner",
        description: "Workspace owner",
        isSystem: true,
      });
      await roleRepo.save(role);

      const membership = membershipRepo.create({
        orgId: org.id,
        userId: user.id,
        roleId: role.id,
        status: MembershipStatus.Active,
      });
      await membershipRepo.save(membership);

      return user;
    });
  }

  async getUserPermissions(userId: string, orgId: string): Promise<string[]> {
    const rows = await this.rolePermissionRepo
      .createQueryBuilder("rp")
      .innerJoin("rp.role", "role")
      .innerJoin("rp.permission", "permission")
      .innerJoin(Membership, "membership", "membership.role_id = role.id")
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

  private async createUniqueSlug(
    name: string,
    orgRepo: Repository<Org>,
  ): Promise<string> {
    const base =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 50) || "saloniq";

    let slug = base;
    let attempt = 1;

    while (await orgRepo.findOne({ where: { slug } })) {
      attempt += 1;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      if (attempt > 5) {
        slug = `${base}-${Date.now().toString().slice(-4)}`;
        break;
      }
    }

    return slug;
  }
}
