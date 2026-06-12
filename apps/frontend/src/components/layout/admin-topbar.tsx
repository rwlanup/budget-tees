'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, StoreIcon, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/auth/auth-store';
import { useLogout } from '@/modules/auth/queries';
import { NotificationBell } from '@/components/shared/notification-bell';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'U';
}

function titleize(segment: string) {
  return segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Builds breadcrumb crumbs from the /admin/* path. The first crumb is always Admin. */
function useCrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean); // ['admin', ...]
  const rest = parts.slice(1);

  const crumbs = [{ label: 'Admin', href: '/admin' as string }];
  let acc = '/admin';
  for (const part of rest) {
    acc += `/${part}`;
    // Skip raw id-ish segments to keep the trail readable.
    const isIdish = /^[0-9a-f-]{8,}$/i.test(part) || /^\d+$/.test(part);
    crumbs.push({ label: isIdish ? 'Detail' : titleize(part), href: acc });
  }
  return crumbs;
}

export function AdminTopbar() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const logout = useLogout();
  const crumbs = useCrumbs();

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => router.replace('/sign-in') });
  };

  return (
    <header className="glass sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6 lg:pl-6">
      <MobileNav />

      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <BreadcrumbItem key={crumb.href} className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="truncate font-heading font-semibold text-foreground">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink asChild>
                      <Link
                        href={crumb.href}
                        className="truncate transition-colors hover:text-brand"
                      >
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      <NotificationBell />
      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="press gap-2 px-2" aria-label="Account menu">
            <Avatar className="size-8 ring-1 ring-border">
              <AvatarFallback className="bg-brand-muted text-xs font-semibold text-brand-strong">
                {initials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              {user ? `${user.firstName} ${user.lastName}` : 'Account'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-sm font-medium">
              {user ? `${user.firstName} ${user.lastName}` : 'Account'}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserIcon className="size-4" aria-hidden />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/">
              <StoreIcon className="size-4" aria-hidden />
              Visit storefront
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
