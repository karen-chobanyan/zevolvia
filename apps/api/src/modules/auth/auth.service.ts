import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { EntityManager, In, IsNull, Repository } from "typeorm";
import { Membership } from "../identity/entities/membership.entity";
import { Org } from "../identity/entities/org.entity";
import { Role } from "../identity/entities/role.entity";
import { RolePermission } from "../identity/entities/role-permission.entity";
import { User } from "../identity/entities/user.entity";
import { MembershipStatus } from "../../common/enums";
import { JwtPayload } from "./types/jwt-payload";
import { RefreshToken } from "./entities/refresh-token.entity";
import { Permission } from "../identity/entities/permission.entity";

type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  orgName?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessMaxAgeMs?: number;
  refreshMaxAgeMs: number;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
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
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    this.logger.debug({ email: normalizedEmail }, "Validating user credentials");

    const user = await this.userRepo.findOne({ where: { email: normalizedEmail } });
    if (!user?.passwordHash) {
      this.logger.warn({ email: normalizedEmail }, "User not found or no password set");
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      this.logger.warn({ email: normalizedEmail, userId: user.id }, "Invalid password");
      return null;
    }

    this.logger.info({ email: normalizedEmail, userId: user.id }, "User credentials validated");
    return user;
  }

  async login(user: User, orgId?: string): Promise<AuthTokens> {
    this.logger.info({ userId: user.id, email: user.email, orgId }, "Login attempt");

    const selectedOrgId = orgId || (await this.getDefaultOrgId(user.id));
    if (!selectedOrgId) {
      this.logger.warn({ userId: user.id }, "Login failed: no orgId provided or found");
      throw new BadRequestException("orgId is required for login");
    }

    const membership = await this.getActiveMembership(user.id, selectedOrgId);
    if (!membership) {
      this.logger.warn(
        { userId: user.id, orgId: selectedOrgId },
        "Login failed: no active membership",
      );
      throw new UnauthorizedException("No active membership for org");
    }

    const tokens = await this.issueTokens(user, selectedOrgId, membership.roleId);
    this.logger.info({ userId: user.id, orgId: selectedOrgId }, "Login successful");

    return tokens;
  }

  async register(input: RegisterInput): Promise<User> {
    const email = input.email?.trim().toLowerCase();
    this.logger.info({ email }, "Registration attempt");

    if (!email || !input.password) {
      this.logger.warn("Registration failed: missing email or password");
      throw new BadRequestException("Email and password are required");
    }

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      this.logger.warn({ email }, "Registration failed: email already in use");
      throw new BadRequestException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const name = [input.firstName, input.lastName].filter(Boolean).join(" ").trim() || null;
    const orgName = input.orgName?.trim() || name || "SalonIQ Workspace";

    this.logger.debug({ email, orgName }, "Creating user and organization");

    return this.userRepo.manager.transaction(async (manager) => {
      const orgRepo = manager.withRepository(this.orgRepo);
      const roleRepo = manager.withRepository(this.roleRepo);
      const userRepo = manager.withRepository(this.userRepo);
      const membershipRepo = manager.withRepository(this.membershipRepo);
      const permissionRepo = manager.withRepository(this.permissionRepo);
      const rolePermissionRepo = manager.withRepository(this.rolePermissionRepo);

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

      // Grant default permissions to the Owner role
      const defaultPermissions = await permissionRepo.find({
        where: {
          key: In([
            "files:read",
            "files:write",
            "files:upload",
            "files:delete",
            "chat:read",
            "chat:write",
            "services:read",
            "services:write",
            "services:delete",
            "clients:read",
            "clients:write",
            "clients:delete",
            "bookings:read",
            "bookings:write",
            "bookings:delete",
            "staff-availability:read",
            "staff-availability:write",
            "billing:read",
            "billing:write",
          ]),
        },
      });

      for (const permission of defaultPermissions) {
        const rolePermission = rolePermissionRepo.create({
          roleId: role.id,
          permissionId: permission.id,
        });
        await rolePermissionRepo.save(rolePermission);
      }

      const membership = membershipRepo.create({
        orgId: org.id,
        userId: user.id,
        roleId: role.id,
        status: MembershipStatus.Active,
      });
      await membershipRepo.save(membership);

      this.logger.info(
        { userId: user.id, email: user.email, orgId: org.id },
        "User registered successfully",
      );

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

  private async getActiveMembership(userId: string, orgId: string): Promise<Membership | null> {
    return this.membershipRepo.findOne({
      where: { userId, orgId, status: MembershipStatus.Active },
    });
  }

  private async createUniqueSlug(name: string, orgRepo: Repository<Org>): Promise<string> {
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

  async refresh(refreshToken: string): Promise<AuthTokens> {
    this.logger.debug("Token refresh attempt");

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt) {
      this.logger.warn("Token refresh failed: invalid or revoked token");
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (stored.expiresAt <= new Date()) {
      await this.refreshTokenRepo.update({ id: stored.id }, { revokedAt: new Date() });
      this.logger.warn({ userId: stored.userId }, "Token refresh failed: token expired");
      throw new UnauthorizedException("Refresh token expired");
    }

    const user = await this.userRepo.findOne({ where: { id: stored.userId } });
    if (!user) {
      this.logger.error({ userId: stored.userId }, "Token refresh failed: user not found");
      throw new UnauthorizedException("User not found");
    }

    const membership = await this.getActiveMembership(user.id, stored.orgId);
    if (!membership) {
      this.logger.warn(
        { userId: user.id, orgId: stored.orgId },
        "Token refresh failed: no active membership",
      );
      throw new UnauthorizedException("No active membership for org");
    }

    const accessToken = await this.buildAccessToken(user, stored.orgId, membership.roleId);

    const accessMaxAgeMs = this.getAccessTokenMaxAgeMs();
    const nextRefresh = await this.refreshTokenRepo.manager.transaction(async (manager) => {
      await manager.update(RefreshToken, { id: stored.id }, { revokedAt: new Date() });
      return this.createRefreshTokenRecord(user.id, stored.orgId, manager);
    });

    this.logger.info({ userId: user.id, orgId: stored.orgId }, "Token refreshed successfully");

    return {
      accessToken,
      refreshToken: nextRefresh.token,
      accessMaxAgeMs,
      refreshMaxAgeMs: nextRefresh.maxAgeMs,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepo.update(
      { tokenHash, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async issueTokens(user: User, orgId: string, roleId: string): Promise<AuthTokens> {
    const accessToken = await this.buildAccessToken(user, orgId, roleId);
    const accessMaxAgeMs = this.getAccessTokenMaxAgeMs();
    const refresh = await this.createRefreshTokenRecord(user.id, orgId);

    return {
      accessToken,
      refreshToken: refresh.token,
      accessMaxAgeMs,
      refreshMaxAgeMs: refresh.maxAgeMs,
    };
  }

  private async buildAccessToken(user: User, orgId: string, roleId: string): Promise<string> {
    const permissions = await this.getUserPermissions(user.id, orgId);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId,
      roleId,
      permissions,
    };

    return this.jwtService.sign(payload);
  }

  private async createRefreshTokenRecord(
    userId: string,
    orgId: string,
    manager?: EntityManager,
  ): Promise<{ token: string; maxAgeMs: number }> {
    const { token, tokenHash } = this.generateRefreshToken();
    const maxAgeMs = this.getRefreshTokenMaxAgeMs();
    const expiresAt = new Date(Date.now() + maxAgeMs);
    const repo = manager ? manager.getRepository(RefreshToken) : this.refreshTokenRepo;

    await repo.save(
      repo.create({
        userId,
        orgId,
        tokenHash,
        expiresAt,
      }),
    );

    return { token, maxAgeMs };
  }

  private generateRefreshToken(): { token: string; tokenHash: string } {
    const token = randomBytes(64).toString("hex");
    return { token, tokenHash: this.hashToken(token) };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private getAccessTokenMaxAgeMs(): number | undefined {
    const expiresIn = this.configService.get<string>("JWT_EXPIRES_IN");
    if (!expiresIn) {
      return undefined;
    }
    return this.parseDurationToMs(expiresIn, 15 * 60 * 1000);
  }

  private getRefreshTokenMaxAgeMs(): number {
    const expiresIn = this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") || "1d";
    return this.parseDurationToMs(expiresIn, 24 * 60 * 60 * 1000);
  }

  private parseDurationToMs(value: string, fallbackMs: number): number {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d+)(ms|s|m|h|d)?$/i);
    if (!match) {
      return fallbackMs;
    }

    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) {
      return fallbackMs;
    }

    const unit = (match[2] || "s").toLowerCase();
    switch (unit) {
      case "ms":
        return amount;
      case "s":
        return amount * 1000;
      case "m":
        return amount * 60 * 1000;
      case "h":
        return amount * 60 * 60 * 1000;
      case "d":
        return amount * 24 * 60 * 60 * 1000;
      default:
        return fallbackMs;
    }
  }
}
