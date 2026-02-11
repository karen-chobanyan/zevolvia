import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { SmsService } from "./sms.service";

@Controller("sms")
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post("twilio")
  @HttpCode(200)
  async handleTwilioWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.smsService.handleIncomingTwilio(body, req);
    res.type("text/xml");
    return "<Response></Response>";
  }

  @Post("twilio/status")
  @HttpCode(200)
  async handleTwilioStatusWebhook(
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.smsService.handleTwilioStatusCallback(body, req);
    res.type("text/plain");
    return "ok";
  }
}
