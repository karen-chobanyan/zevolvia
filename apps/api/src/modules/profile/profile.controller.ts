import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/types/jwt-payload";
import { UpdateOrgDto } from "./dto/update-org.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileService } from "./profile.service";

@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.profileService.getProfile(req.user.sub, req.user.orgId);
  }

  @Patch()
  async updateProfile(@Body() dto: UpdateProfileDto, @Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.profileService.updateProfile(req.user.sub, req.user.orgId, dto);
  }

  @Patch("org")
  async updateOrg(@Body() dto: UpdateOrgDto, @Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.profileService.updateOrg(req.user.sub, req.user.orgId, dto);
  }
}
