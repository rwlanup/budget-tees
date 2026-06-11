import { apiFetch } from '@/lib/api/client';
import type { AuthUser } from '@/lib/auth/auth-store';
import type { LoginInput } from './schemas';

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export interface RegisterBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const authApi = {
  login: (body: LoginInput) =>
    apiFetch<TokenResponse>('/auth/login', { method: 'POST', body, auth: false }),

  register: (body: RegisterBody) =>
    apiFetch<{ message: string }>('/auth/register', { method: 'POST', body, auth: false }),

  verifyEmail: (token: string) =>
    apiFetch<{ success: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: { token },
      auth: false,
    }),

  resendVerification: (email: string) =>
    apiFetch<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: { email },
      auth: false,
    }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ success: boolean }>('/auth/change-password', { method: 'POST', body }),

  me: () => apiFetch<AuthUser>('/auth/me'),

  logout: (refreshToken: string) =>
    apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST', body: { refreshToken } }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    }),

  resetPassword: (body: { token: string; password: string }) =>
    apiFetch<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body,
      auth: false,
    }),
};
