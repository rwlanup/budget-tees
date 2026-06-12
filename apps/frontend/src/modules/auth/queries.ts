'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type RegisterBody } from './api';
import type { LoginInput } from './schemas';
import { useAuthStore } from '@/lib/auth/auth-store';
import { cartApi } from '@/modules/cart/api';
import { cartKeys } from '@/modules/cart/queries';
import { wishlistKeys } from '@/modules/wishlist/queries';
import { getCartToken, clearCartToken } from '@/lib/storefront/cart-token';
import { useRouter } from 'next/navigation';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

/** Bootstraps the current session on load/reload (the client auto-refreshes access). */
export function useMe() {
  const queryClient = useQueryClient();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const res = await authApi.me();
      if (res) {
        queryClient.invalidateQueries({ queryKey: cartKeys.all });
      }
      return res;
    },
    enabled: !!refreshToken,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * Unified login for customers and staff. Authenticates, bootstraps the user,
 * and merges any guest cart. No role gate here — the sign-in page redirects by
 * role and `AdminGuard` enforces admin-area access. Merging a guest cart is a
 * harmless no-op when none exists (e.g. staff).
 */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { setTokens, setUser } = useAuthStore.getState();
      const tokens = await authApi.login(input);
      setTokens(tokens.accessToken, tokens.refreshToken);
      const user = await authApi.me();
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);

      const guestToken = getCartToken();
      if (guestToken) {
        await cartApi.merge(guestToken).catch(() => undefined);
        clearCartToken();
      }
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      return user;
    },
  });
}

export function useRegister() {
  return useMutation({ mutationFn: (body: RegisterBody) => authApi.register(body) });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: (token: string) => authApi.verifyEmail(token) });
}

export function useResendVerification() {
  return useMutation({ mutationFn: (email: string) => authApi.resendVerification(email) });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(body),
    onSuccess: () => {
      useAuthStore.getState().clear();
      queryClient.clear();
      router.replace('/sign-in');
    },
  });
}

/** Logout: revoke refresh token server-side, then clear all local state. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
    },
    onSettled: () => {
      useAuthStore.getState().clear();
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: { token: string; password: string }) => authApi.resetPassword(body),
  });
}
