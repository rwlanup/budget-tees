'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth/auth-store';
import { useMe } from '@/modules/auth/queries';

/**
 * Storefront account gate. Any authenticated user may access /account (backend
 * enforces `profile.manage.own` per request). Guests are sent to /sign-in.
 */
export function AccountGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { data, isLoading, isError } = useMe();

  React.useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  React.useEffect(() => {
    if (!isHydrated) return;
    const redirect = `/sign-in?redirect=${encodeURIComponent(pathname)}`;
    if (!refreshToken) {
      router.replace(redirect);
    } else if (isError) {
      useAuthStore.getState().clear();
      router.replace(redirect);
    }
  }, [isHydrated, refreshToken, isError, router, pathname]);

  if (user) return <>{children}</>;
  if (isHydrated && !refreshToken) return null;
  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }
  return null;
}
