'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { canAccessAdmin, useAuthStore } from '@/lib/auth/auth-store';
import { useMe } from '@/modules/auth/queries';

/**
 * Client-side admin gate. The real authorization is enforced per-request by the
 * backend (`@Permissions`); this only routes the UX (redirect unauth → /sign-in).
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { data, isLoading, isError } = useMe();

  React.useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  React.useEffect(() => {
    if (isHydrated && !refreshToken) {
      router.replace('/sign-in');
      return;
    }
    if (isError) {
      useAuthStore.getState().clear();
      router.replace('/sign-in');
      return;
    }
    if (data && !canAccessAdmin(data)) {
      useAuthStore.getState().clear();
      router.replace('/sign-in');
    }
  }, [isHydrated, refreshToken, isError, data, router]);

  const ready = !!user && canAccessAdmin(user);
  if (ready) return <>{children}</>;

  // Redirecting or bootstrapping.
  if (!refreshToken || isError) return null;
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }
  return null;
}
