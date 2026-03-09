import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { Membership } from "../entities/membership.entity";
import { Invite, InviteStatus } from "../entities/invite.entity";
import { Role } from "../entities/role.entity";
import { User } from "../entities/user.entity";
import { Org } from "../entities/org.entity";
import { MembershipStatus } from "../../../common/enums";
import { EmailService } from "../../email/email.service";
import { CreateInviteDto, UpdateMemberDto } from "../dto/org.dto";

const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class OrgService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Org)
    private readonly orgRepository: Repository<Org>,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  async getMembers(orgId: string): Promise<Membership[]> {
    return this.membershipRepository
      .createQueryBuilder("membership")
      .leftJoinAndSelect("membership.user", "user")
      .leftJoinAndSelect("membership.role", "role")
      .where("membership.orgId = :orgId", { orgId })
      .andWhere("membership.status = :status", { status: MembershipStatus.Active })
      .orderBy("membership.createdAt", "ASC")
      .getMany();
  }

  async updateMemberRole(orgId: string, userId: string, dto: UpdateMemberDto): Promise<Membership> {
    const membership = await this.membershipRepository.findOne({
      where: { orgId, userId },
      relations: ["user", "role"],
    });

    if (!membership) {
      throw new NotFoundException("Member not found");
    }

    if (dto.roleKey) {
      const role = await this.roleRepository.findOne({
        where: { orgId, name: dto.roleKey },
      });

      if (!role) {
        throw new NotFoundException(`Role "${dto.roleKey}" not found`);
      }

      // Prevent changing owner role if it's the only owner
      if (membership.role?.name === "Owner") {
        const ownerCount = await this.membershipRepository
          .createQueryBuilder("m")
          .leftJoin("m.role", "r")
          .where("m.orgId = :orgId", { orgId })
          .andWhere("r.name = :roleName", { roleName: "Owner" })
          .andWhere("m.status = :status", { status: MembershipStatus.Active })
          .getCount();

        if (ownerCount <= 1) {
          throw new BadRequestException("Cannot change role of the only owner");
        }
      }

      const updatedMembership = {
        ...membership,
        roleId: role.id,
      };

      await this.membershipRepository.save(updatedMembership);
    }

    return this.membershipRepository.findOneOrFail({
      where: { orgId, userId },
      relations: ["user", "role"],
    });
  }

  async removeMember(orgId: string, userId: string): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: { orgId, userId },
      relations: ["role"],
    });

    if (!membership) {
      throw new NotFoundException("Member not found");
    }

    // Prevent removing the only owner
    if (membership.role?.name === "Owner") {
      const ownerCount = await this.membershipRepository
        .createQueryBuilder("m")
        .leftJoin("m.role", "r")
        .where("m.orgId = :orgId", { orgId })
        .andWhere("r.name = :roleName", { roleName: "Owner" })
        .andWhere("m.status = :status", { status: MembershipStatus.Active })
        .getCount();

      if (ownerCount <= 1) {
        throw new BadRequestException("Cannot remove the only owner");
      }
    }

    await this.membershipRepository.remove(membership);
  }

  async getInvites(orgId: string): Promise<Invite[]> {
    return this.inviteRepository
      .createQueryBuilder("invite")
      .leftJoinAndSelect("invite.role", "role")
      .leftJoinAndSelect("invite.invitedBy", "invitedBy")
      .where("invite.orgId = :orgId", { orgId })
      .andWhere("invite.status = :status", { status: InviteStatus.Pending })
      .andWhere("invite.expiresAt > :now", { now: new Date() })
      .orderBy("invite.createdAt", "DESC")
      .getMany();
  }

  async createInvite(orgId: string, inviterId: string, dto: CreateInviteDto): Promise<Invite> {
    // Check if user already exists as a member
    const existingMember = await this.membershipRepository
      .createQueryBuilder("m")
      .leftJoin("m.user", "u")
      .where("m.orgId = :orgId", { orgId })
      .andWhere("u.email = :email", { email: dto.email.toLowerCase() })
      .andWhere("m.status = :status", { status: MembershipStatus.Active })
      .getOne();

    if (existingMember) {
      throw new ConflictException("User is already a member of this organization");
    }

    // Check for pending invite
    const existingInvite = await this.inviteRepository.findOne({
      where: {
        orgId,
        email: dto.email.toLowerCase(),
        status: InviteStatus.Pending,
      },
    });

    if (existingInvite && existingInvite.expiresAt > new Date()) {
      throw new ConflictException("An invite is already pending for this email");
    }

    // Get role
    const role = await this.roleRepository.findOne({
      where: { orgId, name: dto.roleKey },
    });

    if (!role) {
      throw new NotFoundException(`Role "${dto.roleKey}" not found`);
    }

    if (dto.roleKey === "Owner") {
      const inviterMembership = await this.membershipRepository.findOne({
        where: { orgId, userId: inviterId, status: MembershipStatus.Active },
        relations: ["role"],
      });

      if (!inviterMembership || inviterMembership.role?.name !== "Owner") {
        throw new ForbiddenException("Only organization owners can invite users as Owner");
      }
    }

    // Get inviter and org info for email
    const [inviter, org] = await Promise.all([
      this.userRepository.findOne({ where: { id: inviterId } }),
      this.orgRepository.findOne({ where: { id: orgId } }),
    ]);

    if (!inviter || !org) {
      throw new NotFoundException("Inviter or organization not found");
    }

    return this.dataSource.transaction(async (manager) => {
      // Create user immediately (without password - they'll set it when accepting invite)
      let user = await manager.findOne(User, {
        where: { email: dto.email.toLowerCase() },
      });

      if (!user) {
        user = manager.create(User, {
          email: dto.email.toLowerCase(),
          name: dto.name ?? null,
          phone: dto.phone ?? null,
          passwordHash: null, // No password yet - will be set when accepting invite
        });
        user = await manager.save(User, user);
      } else {
        // Update existing user's name/phone if provided
        if (dto.name || dto.phone) {
          const updatedUser = {
            ...user,
            name: dto.name ?? user.name,
            phone: dto.phone ?? user.phone,
          };
          user = await manager.save(User, updatedUser);
        }
      }

      // Create membership immediately
      const membership = manager.create(Membership, {
        orgId,
        userId: user.id,
        roleId: role.id,
        status: MembershipStatus.Active,
      });
      await manager.save(Membership, membership);

      // Create invite for password setup
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

      const invite = manager.create(Invite, {
        orgId,
        email: dto.email.toLowerCase(),
        name: dto.name ?? null,
        phone: dto.phone ?? null,
        roleId: role.id,
        invitedById: inviterId,
        token,
        expiresAt,
        status: InviteStatus.Pending,
      });

      const savedInvite = await manager.save(Invite, invite);

      // Send invite email (outside transaction is fine)
      this.emailService.sendInviteEmail({
        email: dto.email,
        inviterName: inviter.name || inviter.email,
        orgName: org.name,
        roleName: role.name,
        inviteToken: token,
        inviteeName: dto.name,
      });

      return manager.findOneOrFail(Invite, {
        where: { id: savedInvite.id },
        relations: ["role", "invitedBy"],
      });
    });
  }

  async cancelInvite(orgId: string, inviteId: string): Promise<void> {
    const invite = await this.inviteRepository.findOne({
      where: { id: inviteId, orgId },
    });

    if (!invite) {
      throw new NotFoundException("Invite not found");
    }

    if (invite.status !== InviteStatus.Pending) {
      throw new BadRequestException("Invite is no longer pending");
    }

    await this.dataSource.transaction(async (manager) => {
      // Remove membership that was created with the invite
      const user = await manager.findOne(User, {
        where: { email: invite.email },
      });

      if (user) {
        await manager.delete(Membership, { orgId, userId: user.id });
      }

      // Mark invite as cancelled
      const updatedInvite = { ...invite, status: InviteStatus.Cancelled };
      await manager.save(Invite, updatedInvite);
    });
  }

  async acceptInvite(
    token: string,
    password: string,
  ): Promise<{ user: User; membership: Membership }> {
    const invite = await this.inviteRepository.findOne({
      where: { token, status: InviteStatus.Pending },
      relations: ["role", "org"],
    });

    if (!invite) {
      throw new NotFoundException("Invite not found or has already been used");
    }

    if (invite.expiresAt < new Date()) {
      const expiredInvite = { ...invite, status: InviteStatus.Expired };
      await this.inviteRepository.save(expiredInvite);
      throw new BadRequestException("Invite has expired");
    }

    return this.dataSource.transaction(async (manager) => {
      // User should already exist (created when invite was sent)
      const user = await manager.findOne(User, {
        where: { email: invite.email },
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      // Set password for the user
      const passwordHash = await bcrypt.hash(password, 10);
      const updatedUser = { ...user, passwordHash };
      await manager.save(User, updatedUser);

      // Membership should already exist
      const membership = await manager.findOne(Membership, {
        where: { orgId: invite.orgId, userId: user.id },
        relations: ["user", "role"],
      });

      if (!membership) {
        throw new NotFoundException("Membership not found");
      }

      // Mark invite as accepted
      const acceptedInvite = { ...invite, status: InviteStatus.Accepted };
      await manager.save(Invite, acceptedInvite);

      return { user: updatedUser, membership };
    });
  }

  async getRoles(orgId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { orgId },
      order: { name: "ASC" },
    });
  }

  async getInviteByToken(token: string): Promise<Invite | null> {
    return this.inviteRepository.findOne({
      where: { token, status: InviteStatus.Pending },
      relations: ["role", "org"],
    });
  }
}
