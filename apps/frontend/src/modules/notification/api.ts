import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { AppNotification } from './types';

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
}

export const notificationApi = {
  list: (params: ListNotificationsParams = {}) =>
    apiFetch<Paginated<AppNotification>>(`/notifications${toQueryString(params)}`),

  unseenCount: () => apiFetch<{ count: number }>('/notifications/unseen-count'),

  markSeen: (id: string) =>
    apiFetch<{ success: boolean }>(`/notifications/${id}/seen`, { method: 'PATCH' }),

  markAllSeen: () => apiFetch<{ success: boolean }>('/notifications/seen-all', { method: 'PATCH' }),
};
