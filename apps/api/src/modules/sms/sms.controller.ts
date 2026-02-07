import { Body, Controller, Header, HttpCode, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { SmsService } from "./sms.service";

@Controller("sms")
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post("twilio")
  @HttpCode(200)
  @Header("Content-Type", "text/xml")
  async handleTwilioWebhook(@Body() body: Record<string, unknown>, @Req() req: Request) {
    await this.smsService.handleIncomingTwilio(body, req);
    return "<Response></Response>";
  }
}
