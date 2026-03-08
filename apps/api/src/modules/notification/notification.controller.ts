import {
  BadRequestException,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Request,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayload } from "../auth/types/jwt-payload";
import { NotificationService } from "./notification.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(@Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }

    return this.notificationService.listForUser(req.user.sub, req.user.orgId);
  }

  @Get("unread-count")
  async unreadCount(@Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }

    const unreadCount = await this.notificationService.unreadCountForUser(
      req.user.sub,
      req.user.orgId,
    );

    return { unreadCount };
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string, @Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }

    return this.notificationService.markAsRead(id, req.user.sub, req.user.orgId);
  }

  @Patch("read-all")
  async markAllAsRead(@Request() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }

    return this.notificationService.markAllAsRead(req.user.sub, req.user.orgId);
  }

  @Sse("stream")
  stream(@Request() req: { user: JwtPayload }): Observable<MessageEvent> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }

    return this.notificationService.streamForUser(req.user.sub, req.user.orgId);
  }
}
