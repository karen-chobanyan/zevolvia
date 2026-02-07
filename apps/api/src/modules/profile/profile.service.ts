import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { Repository } from "typeorm";
import { MembershipStatus } from "../../common/enums";
import { Membership } from "../identity/entities/membership.entity";
import { Org } from "../identity/entities/org.entity";
import { Role } from "../identity/entities/role.entity";
import { User } from "../identity/entities/user.entity";
import { UpdateOrgDto } from "./dto/update-org.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserProfile } from "./entities/user-profile.entity";

const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "avatarUrl",
  "locale",
  "timeZone",
] as const;

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly config: ConfigService,
  ) {}

  private normalizeOptional(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeOrgPhone(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }
    const defaultCountry = (this.config.get<string>("DEFAULT_PHONE_COUNTRY") || "US")
      .trim()
      .toUpperCase() as CountryCode;
    const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
    if (!parsed || !parsed.isValid()) {
      throw new BadRequestException("Invalid phone number");
    }
    return parsed.format("E.164");
  }

  private splitName(name?: string | null) {
    const trimmed = name?.trim();
    if (!trimmed) {
      return { firstName: null, lastName: null };
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: null };
    }
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  private async getMembershipOrThrow(userId: string, orgId: string) {
    const membership = await this.membershipRepo.findOne({
      where: { userId, orgId, status: MembershipStatus.Active },
      relations: ["role"],
    });
    if (!membership) {
      throw new ForbiddenException("Not a member of this organization");
    }
    return membership;
  }

  private async getOwnerUserId(orgId: string) {
    const ownerRole = await this.roleRepo.findOne({
      where: { orgId, name: "Owner" },
    });
    if (!ownerRole) {
      return null;
    }
    const ownerMembership = await this.membershipRepo.findOne({
      where: { orgId, roleId: ownerRole.id, status: MembershipStatus.Active },
    });
    return ownerMembership?.userId ?? null;
  }

  async getProfile(userId: string, orgId?: string) {
    if (!userId) {
      throw new BadRequestException("User is required");
    }
    if (!orgId) {
      throw new BadRequestException("Organization context is required");
    }

    const membership = await this.getMembershipOrThrow(userId, orgId);

    const [user, org, profile] = await Promise.all([
      this.userRepo.findOne({ where: { id: userId } }),
      this.orgRepo.findOne({ where: { id: orgId } }),
      this.profileRepo.findOne({ where: { userId } }),
    ]);

    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    const fallbackName = this.splitName(user.name);
    const profilePayload = profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone ?? user.phone,
          avatarUrl: profile.avatarUrl,
          locale: profile.locale,
          timeZone: profile.timeZone,
        }
      : {
          firstName: fallbackName.firstName,
          lastName: fallbackName.lastName,
          phone: user.phone ?? null,
          avatarUrl: null,
          locale: null,
          timeZone: null,
        };

    const ownerUserId = await this.getOwnerUserId(org.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        profile: profilePayload,
      },
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        phone: org.phone,
        ownerUserId,
        createdAt: org.createdAt,
      },
      membership: {
        role: membership.role?.name ?? null,
        joinedAt: membership.createdAt,
      },
      isOwner: membership.role?.name === "Owner",
    };
  }

  async updateProfile(userId: string, orgId: string | undefined, dto: UpdateProfileDto) {
    if (!userId) {
      throw new BadRequestException("User is required");
    }
    if (!orgId) {
      throw new BadRequestException("Organization context is required");
    }

    await this.getMembershipOrThrow(userId, orgId);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const profile = await this.profileRepo.findOne({ where: { userId } });
    const normalized = {
      firstName: this.normalizeOptional(dto.firstName),
      lastName: this.normalizeOptional(dto.lastName),
      phone: this.normalizeOptional(dto.phone),
      avatarUrl: this.normalizeOptional(dto.avatarUrl),
      locale: this.normalizeOptional(dto.locale),
      timeZone: this.normalizeOptional(dto.timeZone),
    };

    const hasUpdates = PROFILE_FIELDS.some((field) => normalized[field] !== undefined);

    let nextProfile = profile;
    if (hasUpdates) {
      if (!nextProfile) {
        nextProfile = this.profileRepo.create({ userId });
      }

      if (normalized.firstName !== undefined) {
        nextProfile.firstName = normalized.firstName;
      }
      if (normalized.lastName !== undefined) {
        nextProfile.lastName = normalized.lastName;
      }
      if (normalized.phone !== undefined) {
        nextProfile.phone = normalized.phone;
      }
      if (normalized.avatarUrl !== undefined) {
        nextProfile.avatarUrl = normalized.avatarUrl;
      }
      if (normalized.locale !== undefined) {
        nextProfile.locale = normalized.locale;
      }
      if (normalized.timeZone !== undefined) {
        nextProfile.timeZone = normalized.timeZone;
      }

      nextProfile = await this.profileRepo.save(nextProfile);
    }

    const shouldUpdateName =
      normalized.firstName !== undefined || normalized.lastName !== undefined;
    if (shouldUpdateName) {
      const firstName =
        normalized.firstName !== undefined
          ? normalized.firstName
          : (nextProfile?.firstName ?? this.splitName(user.name).firstName);
      const lastName =
        normalized.lastName !== undefined
          ? normalized.lastName
          : (nextProfile?.lastName ?? this.splitName(user.name).lastName);
      const combined = [firstName, lastName].filter(Boolean).join(" ").trim();
      user.name = combined ? combined : null;
    }

    if (normalized.phone !== undefined) {
      user.phone = normalized.phone;
    }

    if (shouldUpdateName || normalized.phone !== undefined) {
      await this.userRepo.save(user);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        profile: nextProfile
          ? {
              firstName: nextProfile.firstName,
              lastName: nextProfile.lastName,
              phone: nextProfile.phone ?? user.phone,
              avatarUrl: nextProfile.avatarUrl,
              locale: nextProfile.locale,
              timeZone: nextProfile.timeZone,
            }
          : null,
      },
    };
  }

  async updateOrg(userId: string, orgId: string | undefined, dto: UpdateOrgDto) {
    if (!orgId) {
      throw new BadRequestException("Organization context is required");
    }
    const membership = await this.getMembershipOrThrow(userId, orgId);
    if (membership.role?.name !== "Owner") {
      throw new ForbiddenException("Only organization owners can update org details");
    }

    const updates: Partial<Org> = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException("Organization name is required");
      }
      updates.name = name;
    }
    if (dto.phone !== undefined) {
      updates.phone = this.normalizeOrgPhone(dto.phone);
    }

    if (!Object.keys(updates).length) {
      throw new BadRequestException("At least one field is required");
    }

    await this.orgRepo.update({ id: orgId }, updates);
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    const ownerUserId = await this.getOwnerUserId(orgId);

    return {
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        phone: org.phone,
        ownerUserId,
        createdAt: org.createdAt,
      },
    };
  }
}
