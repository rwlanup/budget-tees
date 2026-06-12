'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth-store';
import { notificationApi, type ListNotificationsParams } from './api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: ListNotificationsParams) => [...notificationKeys.all, 'list', params] as const,
  unseenCount: ['notifications', 'unseen-count'] as const,
};

/** Authenticated = has a session (notifications require login). */
function useIsAuthed(): boolean {
  return !!useAuthStore((s) => s.refreshToken);
}

/**
 * Lightweight unseen-count badge. Polled every 30s while authenticated; polling pauses when
 * the tab is backgrounded (TanStack pauses `refetchInterval` unless `inBackground` is set).
 */
export function useUnseenNotificationCount() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: notificationKeys.unseenCount,
    queryFn: () => notificationApi.unseenCount(),
    enabled: authed,
    refetchInterval: authed ? 30_000 : false,
    refetchIntervalInBackground: false,
  });
}

/** Notification list — fetched only while the panel is open (no polling). */
export function useNotifications(open: boolean) {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: notificationKeys.list({ limit: 50 }),
    queryFn: () => notificationApi.list({ limit: 50 }),
    enabled: authed && open,
    staleTime: 0, // always fetch fresh when enabled
  });
}

export function useMarkNotificationSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markSeen(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unseenCount });
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllSeen(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unseenCount });
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
