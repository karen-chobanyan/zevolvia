import { apiFetch } from "./api";

export type LoginInput = {
  email: string;
  password: string;
  orgId?: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  orgName?: string;
  country: string;
};

export type MeResponse = {
  sub: string;
  email: string;
  orgId: string;
  roleId?: string;
  permissions?: string[];
};

export async function login(input: LoginInput) {
  return apiFetch<{ ok: boolean }>("/auth/login", {
    method: "POST",
    json: input,
  });
}

export async function register(input: RegisterInput) {
  return apiFetch<{ ok: boolean }>("/auth/register", {
    method: "POST",
    json: input,
  });
}

export async function getMe() {
  return apiFetch<MeResponse>("/auth/me", { method: "GET" });
}

export async function logout() {
  return apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" });
}
