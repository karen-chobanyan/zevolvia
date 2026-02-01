import api from "@/lib/axios";
import { User } from "@/types/auth";

//Login user and return auth token
export const login = (credentials: Partial<User>) => {
  const { email, password } = credentials;
  return api.post(`/auth/login`, { email, password }, { withCredentials: true });
};

//Register user and return auth token
export const register = (userDetails: User) => {
  const { email, password, fname, lname } = userDetails;
  return api.post(`/auth/register`, { email, password, fname, lname });
};

export const registerInvite = (payload: {
  email: string;
  password: string;
  fname: string;
  lname: string;
  token: string;
}) => {
  return api.post(`/auth/register-invite`, payload);
};

export const verifyEmail = (token: string) => {
  return api.post(`/auth/verify-email`, { token });
};

export const resendVerification = (email: string) => {
  return api.post(`/auth/resend-verification`, { email });
};

export const logout = async () => {
  // Clear cookies and revoke refresh token
  await api.post(`/auth/logout`, {}, { withCredentials: true });
  return;
};
