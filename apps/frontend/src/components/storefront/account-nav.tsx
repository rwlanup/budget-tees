'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, MapPin, Package, KeyRound, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { canAccessAdmin, useAuthStore } from '@/lib/auth/auth-store';
import { useLogout } from '@/modules/auth/queries';

const profileItem = { title: 'Profile', href: '/account', icon: User };
const passwordItem = { title: 'Password', href: '/account/password', icon: KeyRound };
// Shopping sub-pages only apply to customers; staff see profile + password only.
const customerItems = [
  { title: 'Addresses', href: '/account/addresses', icon: MapPin },
  { title: 'Orders', href: '/account/orders', icon: Package },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const user = useAuthStore((s) => s.user);
  const items = canAccessAdmin(user)
    ? [profileItem, passwordItem]
    : [profileItem, ...customerItems, passwordItem];

  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-xl lg:border lg:bg-card lg:p-2 lg:shadow-xs">
      {items.map((item) => {
        const active =
          item.href === '/account' ? pathname === '/account' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'press relative flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors',
              active
                ? 'bg-brand-muted font-semibold text-brand-strong'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {active && (
              <span
                className="absolute inset-y-2 left-0 hidden w-0.5 rounded-full bg-brand lg:block"
                aria-hidden
              />
            )}
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.title}
          </Link>
        );
      })}
      <div className="my-1 hidden h-px bg-border lg:block" aria-hidden />
      <button
        type="button"
        onClick={() =>
          logout.mutate(undefined, {
            onSettled: () => {
              toast.success('Signed out');
              router.push('/');
            },
          })
        }
        className="press flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4 shrink-0" aria-hidden />
        Sign out
      </button>
    </nav>
  );
}
