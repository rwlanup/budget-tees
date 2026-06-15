'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminNav } from '@/config/admin-nav';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLowStockCount } from '@/modules/sku/queries';
import { useOrdersPendingCount } from '@/modules/order/queries';
import { useContactPendingCount } from '@/modules/contact/queries';

/** Renders the grouped admin nav. Active route highlighted; unbuilt items disabled. */
export function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: lowStock } = useLowStockCount();
  const { data: pendingOrders } = useOrdersPendingCount();
  const { data: pendingContact } = useContactPendingCount();
  const badgeCounts: Record<
    NonNullable<(typeof adminNav)[number]['items'][number]['badge']>,
    number
  > = {
    'low-stock': lowStock?.count ?? 0,
    'pending-orders': pendingOrders?.count ?? 0,
    'pending-contact': pendingContact?.count ?? 0,
  };

  return (
    <nav className="flex flex-col gap-6 px-3 py-5" aria-label="Admin navigation">
      {adminNav.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active =
                item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              const Icon = item.icon;
              const badgeCount = item.badge ? badgeCounts[item.badge] : 0;

              if (item.soon) {
                return (
                  <li key={item.href}>
                    <span
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
                      aria-disabled
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1">{item.title}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Soon
                      </Badge>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-brand-muted text-brand-strong shadow-xs'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand transition-all duration-200',
                        active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
                      )}
                    />
                    <Icon
                      className={cn(
                        'size-4 shrink-0 transition-colors',
                        active ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground',
                      )}
                      aria-hidden
                    />
                    <span>{item.title}</span>
                    {badgeCount > 0 && (
                      <Badge
                        variant="warning"
                        className="ml-auto px-1.5 text-[10px] tabular-nums"
                        aria-label={`${item.title}: ${badgeCount} need attention`}
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
