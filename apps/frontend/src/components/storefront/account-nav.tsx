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
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active =
          item.href === '/account' ? pathname === '/account' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm',
              active
                ? 'bg-secondary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {item.title}
          </Link>
        );
      })}
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
        className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </nav>
  );
}
