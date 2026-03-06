import { Body, Controller, Get, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";
import { JwtPayload } from "../auth/types/jwt-payload";
import { SmsRetentionService } from "../sms/sms-retention.service";
import { RunSmsRetentionDto, UpdateSmsRetentionSettingsDto } from "../sms/dto/sms-retention.dto";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly smsRetentionService: SmsRetentionService,
  ) {}

  @Get("summary")
  async summary(@Request() req: { user: JwtPayload }) {
    return this.dashboardService.getSummary(req.user.orgId);
  }

  @Get("automations/sms-retention")
  async getSmsRetentionSettings(@Request() req: { user: JwtPayload }) {
    return this.smsRetentionService.getSettings(req.user.orgId);
  }

  @Patch("automations/sms-retention")
  async updateSmsRetentionSettings(
    @Request() req: { user: JwtPayload },
    @Body() dto: UpdateSmsRetentionSettingsDto,
  ) {
    return this.smsRetentionService.updateSettings(req.user.orgId, dto);
  }

  @Post("automations/sms-retention/run")
  async runSmsRetention(@Request() req: { user: JwtPayload }, @Body() dto: RunSmsRetentionDto) {
    return this.smsRetentionService.run(req.user.orgId, dto?.dryRun ?? false);
  }
}
