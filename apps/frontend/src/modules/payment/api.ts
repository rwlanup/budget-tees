import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { Payment } from './types';

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
}

export interface RefundBody {
  amount: number;
  reason: string;
  externalRef?: string;
}

export const paymentApi = {
  list: (params: ListPaymentsParams = {}) =>
    apiFetch<Paginated<Payment>>(`/admin/payments${toQueryString(params)}`),

  refund: (id: string, body: RefundBody) =>
    apiFetch<unknown>(`/admin/payments/${id}/refund`, { method: 'POST', body }),

  markOrderPaid: (orderId: string) =>
    apiFetch<{ paid: boolean }>(`/admin/payments/order/${orderId}/mark-paid`, { method: 'POST' }),
};
