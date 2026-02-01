import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthService, AuthTokens } from "./auth.service";
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
    const tokens = await this.authService.login(req.user, orgId);
    this.setAuthCookies(res, tokens);
    return { ok: true };
  }

  @Post("register")
  async register(@Body() body: RegisterBody, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.register(body);
    const tokens = await this.authService.login(user);
    this.setAuthCookies(res, tokens);
    return { ok: true };
  }

  @Post("refresh")
  async refresh(
    @Request() req: { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const tokens = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(
    @Request() req: { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    this.clearAuthCookies(res);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Request() req: { user: JwtPayload }) {
    return req.user;
  }

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    res.cookie("access_token", tokens.accessToken, this.accessCookieOptions(tokens.accessMaxAgeMs));
    res.cookie(
      "refresh_token",
      tokens.refreshToken,
      this.refreshCookieOptions(tokens.refreshMaxAgeMs),
    );
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie("access_token", this.accessCookieOptions());
    res.clearCookie("refresh_token", this.refreshCookieOptions());
  }

  private accessCookieOptions(maxAge?: number) {
    return this.cookieOptions("/", maxAge);
  }

  private refreshCookieOptions(maxAge?: number) {
    return this.cookieOptions("/api/auth/refresh", maxAge);
  }

  private cookieOptions(path: string, maxAge?: number) {
    const isProd = process.env.NODE_ENV === "production";
    const options = {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax" as const,
      path,
    };

    if (typeof maxAge === "number") {
      return { ...options, maxAge };
    }

    return options;
  }
}
