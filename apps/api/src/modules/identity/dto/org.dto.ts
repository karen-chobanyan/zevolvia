import { Membership } from "../entities/membership.entity";
import { Invite, InviteStatus } from "../entities/invite.entity";

export interface CreateInviteDto {
  email: string;
  name?: string;
  phone?: string;
  roleKey: string;
}

export interface UpdateMemberDto {
  roleKey?: string;
}

export class MemberResponseDto {
  userId: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  roleId: string;
  status: string;
  joinedAt: Date;

  private constructor(data: MemberResponseDto) {
    this.userId = data.userId;
    this.email = data.email;
    this.name = data.name;
    this.phone = data.phone;
    this.role = data.role;
    this.roleId = data.roleId;
    this.status = data.status;
    this.joinedAt = data.joinedAt;
  }

  static fromMembership(membership: Membership): MemberResponseDto {
    return new MemberResponseDto({
      userId: membership.userId,
      email: membership.user?.email ?? "",
      name: membership.user?.name ?? null,
      phone: membership.user?.phone ?? null,
      role: membership.role?.name ?? "",
      roleId: membership.roleId,
      status: membership.status,
      joinedAt: membership.createdAt,
    });
  }
}

export class InviteResponseDto {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  roleId: string;
  invitedBy: string | null;
  expiresAt: Date;
  status: InviteStatus;
  createdAt: Date;

  private constructor(data: InviteResponseDto) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.phone = data.phone;
    this.role = data.role;
    this.roleId = data.roleId;
    this.invitedBy = data.invitedBy;
    this.expiresAt = data.expiresAt;
    this.status = data.status;
    this.createdAt = data.createdAt;
  }

  static fromInvite(invite: Invite): InviteResponseDto {
    return new InviteResponseDto({
      id: invite.id,
      email: invite.email,
      name: invite.name,
      phone: invite.phone,
      role: invite.role?.name ?? "",
      roleId: invite.roleId,
      invitedBy: invite.invitedBy?.email ?? null,
      expiresAt: invite.expiresAt,
      status: invite.status,
      createdAt: invite.createdAt,
    });
  }
}

export class RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;

  private constructor(data: RoleResponseDto) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.isSystem = data.isSystem;
  }

  static fromEntity(role: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
  }): RoleResponseDto {
    return new RoleResponseDto({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    });
  }
}
