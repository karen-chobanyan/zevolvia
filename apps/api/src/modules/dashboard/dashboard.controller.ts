import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";
import { JwtPayload } from "../auth/types/jwt-payload";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  async summary(@Request() req: { user: JwtPayload }) {
    return this.dashboardService.getSummary(req.user.orgId);
  }
}
