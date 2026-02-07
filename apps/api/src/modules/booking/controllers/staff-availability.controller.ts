import { BadRequestException, Controller, Get, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions.guard";
import { Permissions } from "../../auth/decorators/permissions.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload";
import { StaffAvailabilityService } from "../services/staff-availability.service";
import { AvailableSlotDto } from "../dto/staff-availability.dto";

@Controller("staff-availability")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffAvailabilityController {
  constructor(private readonly staffAvailabilityService: StaffAvailabilityService) {}

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
