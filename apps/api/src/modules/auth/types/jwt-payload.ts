export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  roleId?: string;
  permissions?: string[];
}
