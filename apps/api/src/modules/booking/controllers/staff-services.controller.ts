import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions.guard";
import { Permissions } from "../../auth/decorators/permissions.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload";
import { StaffServicesService } from "../services/staff-services.service";

type SetServicesDto = {
  serviceIds: string[];
};

@Controller("staff-services")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StaffServicesController {
  constructor(private readonly staffServicesService: StaffServicesService) {}

  @Get()
  @Permissions("services:read")
  async getAllStaffWithServices(@Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.staffServicesService.getAllStaffWithServices(req.user.orgId);
  }

  @Get("staff/:userId")
  @Permissions("services:read")
  async getServicesForStaff(@Param("userId") userId: string, @Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.staffServicesService.getServicesForStaff(req.user.orgId, userId);
  }

  @Get("service/:serviceId")
  @Permissions("services:read")
  async getStaffForService(
    @Param("serviceId") serviceId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const memberships = await this.staffServicesService.getStaffForService(
      req.user.orgId,
      serviceId,
    );
    return memberships.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      role: m.role?.name,
    }));
  }

  @Put("staff/:userId")
  @Permissions("services:write")
  async setServicesForStaff(
    @Param("userId") userId: string,
    @Body() dto: SetServicesDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    if (!Array.isArray(dto.serviceIds)) {
      throw new BadRequestException("serviceIds must be an array");
    }
    return this.staffServicesService.setServicesForStaff(req.user.orgId, userId, dto.serviceIds);
  }

  @Post("staff/:userId/service/:serviceId")
  @Permissions("services:write")
  async addServiceToStaff(
    @Param("userId") userId: string,
    @Param("serviceId") serviceId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    await this.staffServicesService.addServiceToStaff(req.user.orgId, userId, serviceId);
    return { message: "Service assigned to staff member" };
  }

  @Delete("staff/:userId/service/:serviceId")
  @Permissions("services:write")
  async removeServiceFromStaff(
    @Param("userId") userId: string,
    @Param("serviceId") serviceId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    await this.staffServicesService.removeServiceFromStaff(req.user.orgId, userId, serviceId);
    return { message: "Service removed from staff member" };
  }
}
