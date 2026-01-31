import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { User } from "../identity/entities/user.entity";
import { JwtPayload } from "./types/jwt-payload";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Request() req: { user: User }, @Body("orgId") orgId?: string) {
    return this.authService.login(req.user, orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Request() req: { user: JwtPayload }) {
    return req.user;
  }
}
