'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Authenticated user snapshot from `GET /auth/me` (User entity + eager role). */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roleId: string;
  role: { id: string; name: string };
  avatarMediaId: string | null;
}

interface AuthState {
  accessToken: string | null; // memory only — never persisted
  refreshToken: string | null; // persisted so reload can re-bootstrap
  user: AuthUser | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
  isHydrated: boolean;
  setHydrated: (isHydrated: boolean) => void;
}

/**
 * Single source of truth for session tokens. Accessible outside React via
 * `useAuthStore.getState()` (used by the fetch client for bearer + refresh).
 * Access token lives in memory only; refresh token is persisted to localStorage
 * so a page reload can mint a fresh access token. (Tradeoff: refresh token is
 * readable by JS — acceptable here as the backend rotates + reuse-detects it.)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isHydrated: false,
      accessToken: null,
      refreshToken: getRefreshTokenFromLocalStorage(),
      user: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
      setHydrated: (isHydrated: boolean) => set({ isHydrated }),
    }),
    {
      name: 'bt-auth',
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    },
  ),
);

export const useIsAuthStoreHydrated = () => {
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);
};

/** Admin-panel access gate. Server `@Permissions` is the real authority per action. */
export function canAccessAdmin(user: AuthUser | null): boolean {
  return !!user && user.role?.name !== 'customer';
}

export function getRefreshTokenFromLocalStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const btAuth = localStorage.getItem('bt-auth');
    const parsed = btAuth ? JSON.parse(btAuth) : null;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'refreshToken' in parsed &&
      typeof parsed.refreshToken === 'string'
    ) {
      return parsed.refreshToken as string;
    }
    return null;
  } catch (_e) {
    return null;
  }
}
