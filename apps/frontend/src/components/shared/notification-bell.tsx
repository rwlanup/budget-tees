'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, Loader2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth/auth-store';
import {
  useMarkAllNotificationsSeen,
  useMarkNotificationSeen,
  useNotifications,
  useUnseenNotificationCount,
} from '@/modules/notification/queries';
import type { AppNotification } from '@/modules/notification/types';

/** Compact relative timestamp (no date lib in the project — native math). */
function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

/**
 * Header notifications bell + panel. Shared by the storefront header and the admin top bar.
 * Count is polled (30s) via `useUnseenNotificationCount`; the list is fetched only while the
 * panel is open. Clicking a row marks it seen and navigates to its stored route.
 */
export function NotificationBell() {
  const router = useRouter();
  const authed = useAuthStore((s) => !!s.refreshToken);
  const [open, setOpen] = React.useState(false);

  const { data: count } = useUnseenNotificationCount();
  const { data, isLoading } = useNotifications(open);
  const markSeen = useMarkNotificationSeen();
  const markAll = useMarkAllNotificationsSeen();

  if (!authed) return null;

  const unseen = count?.count ?? 0;
  const items = data?.items ?? [];

  const handleSelect = (n: AppNotification) => {
    setOpen(false);
    if (!n.isSeen) markSeen.mutate(n.id);
    router.push(n.route);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unseen > 0 ? `Notifications, ${unseen} unread` : 'Notifications'}
        >
          <Bell className="size-5" aria-hidden />
          {unseen > 0 && (
            <span className="reveal-scale absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-brand-foreground tabular-nums ring-2 ring-background">
              {unseen > 99 ? '99+' : unseen}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="font-heading text-sm font-semibold">Notifications</p>
          {unseen > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <CheckCheck className="size-3.5" aria-hidden />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <BellOff className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(n)}
                    className={cn(
                      'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
                      !n.isSeen && 'bg-brand-muted/40',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        n.isSeen ? 'bg-transparent' : 'bg-brand',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">{n.title}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {markSeen.isPending && (
          <div className="flex items-center justify-center border-t py-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
