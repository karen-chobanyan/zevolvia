import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { JwtPayload } from "../auth/types/jwt-payload";
import { BillingService } from "./billing.service";
import { CompleteCheckoutDto } from "./dto/complete-checkout.dto";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get("status")
  @Permissions("billing:read")
  async getStatus(@Req() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.billingService.getStatus(req.user.sub, req.user.orgId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post("checkout")
  @Permissions("billing:write")
  async createCheckoutSession(@Body() dto: CreateCheckoutDto, @Req() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.billingService.createCheckoutSession(
      req.user.sub,
      req.user.orgId,
      dto.plan as "monthly" | "yearly",
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post("checkout/complete")
  @Permissions("billing:write")
  async completeCheckoutSession(
    @Body() dto: CompleteCheckoutDto,
    @Req() req: { user: JwtPayload },
  ) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.billingService.completeCheckoutSession(req.user.sub, req.user.orgId, dto.sessionId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post("portal")
  @Permissions("billing:write")
  async createPortalSession(@Req() req: { user: JwtPayload }) {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    return this.billingService.createPortalSession(req.user.sub, req.user.orgId);
  }

  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(@Req() req: Request) {
    return this.billingService.handleWebhook(req.body as Buffer, req.headers["stripe-signature"]);
  }
}
