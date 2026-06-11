'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Package, Heart, LogOut, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, useIsAuthStoreHydrated, canAccessAdmin } from '@/lib/auth/auth-store';
import { useMe, useLogout } from '@/modules/auth/queries';

/** Auth-aware account dropdown. Guests see sign-in links; members see account links + logout. */
export function AccountMenu() {
  const router = useRouter();
  useIsAuthStoreHydrated();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const { data: user } = useMe();
  const logout = useLogout();

  const signedIn = isHydrated && !!refreshToken && !!user;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        toast.success('Signed out');
        router.push('/');
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu">
          <User className="size-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {signedIn ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User className="size-4" aria-hidden />
                My account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account/orders">
                <Package className="size-4" aria-hidden />
                Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/wishlist">
                <Heart className="size-4" aria-hidden />
                Wishlist
              </Link>
            </DropdownMenuItem>
            {canAccessAdmin(user) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="size-4" aria-hidden />
                    Admin panel
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} disabled={logout.isPending}>
              <LogOut className="size-4" aria-hidden />
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/sign-in">
                <LogIn className="size-4" aria-hidden />
                Sign in
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/sign-up">
                <UserPlus className="size-4" aria-hidden />
                Create account
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
