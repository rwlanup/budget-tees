import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { Sale, SaleScope, SaleType } from './types';

export interface ListSalesParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'upcoming' | 'expired';
}

export interface CreateSaleBody {
  name: string;
  type: SaleType;
  value: number;
  maxDiscountAmount?: number | null;
  scope: SaleScope;
  productIds?: string[];
  categoryIds?: string[];
  excludedProductIds?: string[];
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export interface UpdateSaleBody {
  name?: string;
  value?: number;
  maxDiscountAmount?: number | null;
  productIds?: string[];
  categoryIds?: string[];
  excludedProductIds?: string[];
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export const saleApi = {
  list: (params: ListSalesParams = {}) =>
    apiFetch<Paginated<Sale>>(`/admin/sales${toQueryString(params)}`),
  get: (id: string) => apiFetch<Sale>(`/admin/sales/${id}`),
  create: (body: CreateSaleBody) => apiFetch<Sale>('/admin/sales', { method: 'POST', body }),
  update: (id: string, body: UpdateSaleBody) =>
    apiFetch<Sale>(`/admin/sales/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/sales/${id}`, { method: 'DELETE' }),
};
