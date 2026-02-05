import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions.guard";
import { Permissions } from "../../auth/decorators/permissions.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload";
import { OrgService } from "../services/org.service";
import {
  CreateInviteDto,
  UpdateMemberDto,
  MemberResponseDto,
  InviteResponseDto,
  RoleResponseDto,
} from "../dto/org.dto";

@Controller("org")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get("members")
  @Permissions("org:members:read")
  async getMembers(@Request() req: { user: JwtPayload }): Promise<MemberResponseDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const members = await this.orgService.getMembers(req.user.orgId);
    return members.map((m) => MemberResponseDto.fromMembership(m));
  }

  @Patch("members/:userId")
  @Permissions("org:members:write")
  async updateMember(
    @Param("userId") userId: string,
    @Body() dto: UpdateMemberDto,
    @Request() req: { user: JwtPayload },
  ): Promise<MemberResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const membership = await this.orgService.updateMemberRole(req.user.orgId, userId, dto);
    return MemberResponseDto.fromMembership(membership);
  }

  @Delete("members/:userId")
  @Permissions("org:members:delete")
  async removeMember(
    @Param("userId") userId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{ message: string }> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    await this.orgService.removeMember(req.user.orgId, userId);
    return { message: "Member removed successfully" };
  }

  @Get("invites")
  @Permissions("org:members:read")
  async getInvites(@Request() req: { user: JwtPayload }): Promise<InviteResponseDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const invites = await this.orgService.getInvites(req.user.orgId);
    return invites.map((i) => InviteResponseDto.fromInvite(i));
  }

  @Post("invites")
  @Permissions("org:members:write")
  async createInvite(
    @Body() dto: CreateInviteDto,
    @Request() req: { user: JwtPayload },
  ): Promise<InviteResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const invite = await this.orgService.createInvite(req.user.orgId, req.user.sub, dto);
    return InviteResponseDto.fromInvite(invite);
  }

  @Post("invites/:inviteId/cancel")
  @Permissions("org:members:write")
  async cancelInvite(
    @Param("inviteId") inviteId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{ message: string }> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    await this.orgService.cancelInvite(req.user.orgId, inviteId);
    return { message: "Invite cancelled successfully" };
  }

  @Get("roles")
  @Permissions("org:members:read")
  async getRoles(@Request() req: { user: JwtPayload }): Promise<RoleResponseDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const roles = await this.orgService.getRoles(req.user.orgId);
    return roles.map((r) => RoleResponseDto.fromEntity(r));
  }
}
