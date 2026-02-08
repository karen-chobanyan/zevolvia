import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Res,
  UseGuards,
  Inject,
  forwardRef,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthService, AuthTokens } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { User } from "../identity/entities/user.entity";
import { JwtPayload } from "./types/jwt-payload";
import { OrgService } from "../identity/services/org.service";

type RegisterBody = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  orgName?: string;
};

type AcceptInviteBody = {
  token: string;
  password: string;
};

type ForgotPasswordBody = {
  email: string;
};

type ChangePasswordBody = {
  currentPassword: string;
  newPassword: string;
};

type ResetPasswordBody = {
  token: string;
  newPassword: string;
};

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => OrgService))
    private readonly orgService: OrgService,
  ) {}

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

  @Post("forgot-password")
  async forgotPassword(@Body() body: ForgotPasswordBody) {
    if (!body.email) {
      throw new BadRequestException("Email is required");
    }

    await this.authService.forgotPassword(body.email);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(@Request() req: { user: JwtPayload }, @Body() body: ChangePasswordBody) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException("Current password and new password are required");
    }

    await this.authService.changePassword(
      req.user.sub,
      req.user.orgId,
      body.currentPassword,
      body.newPassword,
    );
    return { ok: true };
  }

  @Post("reset-password")
  async resetPassword(@Body() body: ResetPasswordBody) {
    if (!body.token || !body.newPassword) {
      throw new BadRequestException("Token and new password are required");
    }

    await this.authService.resetPassword(body.token, body.newPassword);
    return { ok: true };
  }

  @Get("invite")
  async getInvite(@Query("token") token: string) {
    if (!token) {
      throw new BadRequestException("Token is required");
    }
    const invite = await this.orgService.getInviteByToken(token);
    if (!invite) {
      throw new NotFoundException("Invite not found or has expired");
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException("Invite has expired");
    }
    return {
      email: invite.email,
      name: invite.name,
      orgName: invite.org?.name,
      roleName: invite.role?.name,
    };
  }

  @Post("accept-invite")
  async acceptInvite(@Body() body: AcceptInviteBody, @Res({ passthrough: true }) res: Response) {
    if (!body.token || !body.password) {
      throw new BadRequestException("Token and password are required");
    }

    const { user, membership } = await this.orgService.acceptInvite(body.token, body.password);
    const tokens = await this.authService.login(user, membership.orgId);
    this.setAuthCookies(res, tokens);
    return { ok: true };
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
