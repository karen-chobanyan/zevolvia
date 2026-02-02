import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtPayload } from "../auth/types/jwt-payload";
import { ChatService } from "./chat.service";
import { AskDto } from "./dto/ask.dto";
import { CreateSessionDto } from "./dto/create-session.dto";

@Controller("chat")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("sessions")
  @Permissions("chat:write")
  async createSession(@Body() dto: CreateSessionDto, @Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.chatService.createSession(req.user.sub, req.user.orgId, dto?.title);
  }

  @Get("sessions")
  @Permissions("chat:read")
  async listSessions(@Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.chatService.listSessions(req.user.sub, req.user.orgId);
  }

  @Get("sessions/:id/messages")
  @Permissions("chat:read")
  async listMessages(@Param("id") id: string, @Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.chatService.listMessages(id, req.user.sub, req.user.orgId);
  }

  @Post("sessions/:id/ask")
  @Permissions("chat:write")
  async ask(@Param("id") id: string, @Body() dto: AskDto, @Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.chatService.ask(id, req.user.sub, req.user.orgId, dto);
  }
}
