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
import { ClientsService } from "../services/clients.service";
import { CreateClientDto, UpdateClientDto, ClientResponseDto } from "../dto/client.dto";

@Controller("clients")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Permissions("clients:write")
  async create(
    @Body() dto: CreateClientDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ClientResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const client = await this.clientsService.create(req.user.orgId, dto);
    return ClientResponseDto.fromEntity(client);
  }

  @Get()
  @Permissions("clients:read")
  async findAll(
    @Query("search") search: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{
    items: ClientResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const result = await this.clientsService.findAll({
      orgId: req.user.orgId,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return {
      items: result.items.map((c) => ClientResponseDto.fromEntity(c)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get("search")
  @Permissions("clients:read")
  async search(
    @Query("q") query: string,
    @Query("limit") limit: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ClientResponseDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const clients = await this.clientsService.search(
      req.user.orgId,
      query,
      limit ? parseInt(limit, 10) : 10,
    );
    return clients.map((c) => ClientResponseDto.fromEntity(c));
  }

  @Get(":id")
  @Permissions("clients:read")
  async findById(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<ClientResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const client = await this.clientsService.findById(id, req.user.orgId);
    return ClientResponseDto.fromEntity(client);
  }

  @Patch(":id")
  @Permissions("clients:write")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ClientResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const client = await this.clientsService.update(id, req.user.orgId, dto);
    return ClientResponseDto.fromEntity(client);
  }

  @Delete(":id")
  @Permissions("clients:delete")
  async delete(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{ message: string }> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    await this.clientsService.delete(id, req.user.orgId);
    return { message: "Client deleted successfully" };
  }
}
