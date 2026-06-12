import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { ItemCondition, ResolutionType, ReturnReason, ReturnRequest } from './types';

export interface ListReturnsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ReviewBody {
  decision: 'APPROVE' | 'REJECT';
  adminNote?: string;
}

export interface ReceiveBody {
  items: { returnItemId: string; conditionOnReceipt: ItemCondition; restock: boolean }[];
}

export interface ResolveBody {
  refundAmount?: number;
  externalRef?: string;
}

export const returnApi = {
  list: (params: ListReturnsParams = {}) =>
    apiFetch<Paginated<ReturnRequest>>(`/admin/returns${toQueryString(params)}`),
  get: (id: string) => apiFetch<ReturnRequest>(`/admin/returns/${id}`),
  review: (id: string, body: ReviewBody) =>
    apiFetch<ReturnRequest>(`/admin/returns/${id}/review`, { method: 'PATCH', body }),
  receive: (id: string, body: ReceiveBody) =>
    apiFetch<ReturnRequest>(`/admin/returns/${id}/receive`, { method: 'PATCH', body }),
  resolve: (id: string, body: ResolveBody) =>
    apiFetch<ReturnRequest>(`/admin/returns/${id}/resolve`, { method: 'POST', body }),
};

// --- Customer-facing endpoints (own returns) ---

/** Per-line eligibility, from GET /orders/:orderId/returnable. */
export interface ReturnableItem {
  orderItemId: string;
  productName: string;
  ordered: number;
  returned: number;
  returnable: number;
}

export interface Returnable {
  eligible: boolean;
  items: ReturnableItem[];
}

export interface CreateReturnItem {
  orderItemId: string;
  quantity: number;
  /** Required when resolutionType is EXCHANGE. */
  exchangeSkuId?: string;
}

export interface CreateReturnBody {
  resolutionType: ResolutionType;
  reason: ReturnReason;
  customerNote?: string;
  items: CreateReturnItem[];
}

export const customerReturnApi = {
  returnable: (orderId: string) => apiFetch<Returnable>(`/orders/${orderId}/returnable`),
  create: (orderId: string, body: CreateReturnBody) =>
    apiFetch<ReturnRequest>(`/orders/${orderId}/returns`, { method: 'POST', body }),
  list: (params: ListReturnsParams = {}) =>
    apiFetch<Paginated<ReturnRequest>>(`/returns${toQueryString(params)}`),
  get: (idOrNumber: string) => apiFetch<ReturnRequest>(`/returns/${idOrNumber}`),
  cancel: (id: string) => apiFetch<ReturnRequest>(`/returns/${id}/cancel`, { method: 'POST' }),
};
