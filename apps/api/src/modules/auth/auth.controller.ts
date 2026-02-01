import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { User } from "../identity/entities/user.entity";
import { JwtPayload } from "./types/jwt-payload";

type RegisterBody = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  orgName?: string;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(
    @Request() req: { user: User },
    @Res({ passthrough: true }) res: Response,
    @Body("orgId") orgId?: string,
  ) {
    const { accessToken } = await this.authService.login(req.user, orgId);
    this.setAuthCookie(res, accessToken);
    return { ok: true };
  }

  @Post("register")
  async register(
    @Body() body: RegisterBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(body);
    const { accessToken } = await this.authService.login(user);
    this.setAuthCookie(res, accessToken);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token", this.cookieOptions());
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Request() req: { user: JwtPayload }) {
    return req.user;
  }

  private setAuthCookie(res: Response, token: string) {
    res.cookie("access_token", token, this.cookieOptions());
  }

  private cookieOptions() {
    const isProd = process.env.NODE_ENV === "production";
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    };
  }
}
