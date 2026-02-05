import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions.guard";
import { Permissions } from "../../auth/decorators/permissions.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload";
import { StaffAvailabilityService } from "../services/staff-availability.service";
import {
  SetStaffAvailabilityDto,
  StaffAvailabilityResponseDto,
  AvailableSlotDto,
} from "../dto/staff-availability.dto";

@Controller("staff-availability")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffAvailabilityController {
  constructor(private readonly staffAvailabilityService: StaffAvailabilityService) {}

  @Get()
  @Permissions("staff-availability:read")
  async findAll(@Request() req: { user: JwtPayload }): Promise<StaffAvailabilityResponseDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const availabilities = await this.staffAvailabilityService.findAll(req.user.orgId);
    return availabilities.map((a) => StaffAvailabilityResponseDto.fromEntity(a));
  }

  @Get("staff/:userId")
  @Permissions("staff-availability:read")
  async findByStaff(
    @Param("userId") userId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<StaffAvailabilityResponseDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const availabilities = await this.staffAvailabilityService.findByStaff(req.user.orgId, userId);
    return availabilities.map((a) => StaffAvailabilityResponseDto.fromEntity(a));
  }

  @Put("staff/:userId")
  @Permissions("staff-availability:write")
  async setSchedule(
    @Param("userId") userId: string,
    @Body() schedules: SetStaffAvailabilityDto[],
    @Request() req: { user: JwtPayload },
  ): Promise<StaffAvailabilityResponseDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const availabilities = await this.staffAvailabilityService.setSchedule(
      req.user.orgId,
      userId,
      schedules,
    );
    return availabilities.map((a) => StaffAvailabilityResponseDto.fromEntity(a));
  }

  @Get("slots")
  @Permissions("staff-availability:read")
  async getAvailableSlots(
    @Query("staffId") staffId: string,
    @Query("date") date: string,
    @Query("durationMinutes") durationMinutes: string,
    @Query("slotInterval") slotInterval: string,
    @Request() req: { user: JwtPayload },
  ): Promise<AvailableSlotDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }

    if (!staffId || !date || !durationMinutes) {
      throw new BadRequestException("staffId, date, and durationMinutes are required");
    }

    return this.staffAvailabilityService.getAvailableSlots(
      req.user.orgId,
      staffId,
      date,
      parseInt(durationMinutes, 10),
      slotInterval ? parseInt(slotInterval, 10) : 15,
    );
  }
}
