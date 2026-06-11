import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { FulfillmentMethod, Order, OrderStatus, PaymentStatus } from './types';

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentMethod?: FulfillmentMethod;
  userId?: string;
}

export const orderApi = {
  list: (params: ListOrdersParams = {}) =>
    apiFetch<Paginated<Order>>(`/admin/orders${toQueryString(params)}`),

  get: (id: string) => apiFetch<Order>(`/admin/orders/${id}`),

  updateStatus: (id: string, status: OrderStatus, note?: string) =>
    apiFetch<Order>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status, note } }),

  fulfillment: (
    id: string,
    body: { status: OrderStatus; trackingCarrier?: string; trackingNumber?: string },
  ) => apiFetch<Order>(`/admin/orders/${id}/fulfillment`, { method: 'PATCH', body }),
};
