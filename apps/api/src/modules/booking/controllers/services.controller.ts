import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions.guard";
import { Permissions } from "../../auth/decorators/permissions.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload";
import { ServicesService } from "../services/services.service";
import { CreateServiceDto, UpdateServiceDto, ServiceResponseDto } from "../dto/service.dto";

@Controller("services")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Permissions("services:write")
  async create(
    @Body() dto: CreateServiceDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ServiceResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const service = await this.servicesService.create(req.user.orgId, dto);
    return ServiceResponseDto.fromEntity(service);
  }

  @Get()
  @Permissions("services:read")
  async findAll(
    @Query("includeInactive") includeInactive: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ServiceResponseDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const services = await this.servicesService.findAll(req.user.orgId, includeInactive === "true");
    return services.map((s) => ServiceResponseDto.fromEntity(s));
  }

  @Get(":id")
  @Permissions("services:read")
  async findById(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ServiceResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const service = await this.servicesService.findById(id, req.user.orgId);
    return ServiceResponseDto.fromEntity(service);
  }

  @Patch(":id")
  @Permissions("services:write")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateServiceDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ServiceResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const service = await this.servicesService.update(id, req.user.orgId, dto);
    return ServiceResponseDto.fromEntity(service);
  }

  @Delete(":id")
  @Permissions("services:delete")
  async delete(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{ message: string }> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    await this.servicesService.delete(id, req.user.orgId);
    return { message: "Service deleted successfully" };
  }
}
