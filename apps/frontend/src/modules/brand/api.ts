import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { Brand } from './types';

export interface ListBrandsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface BrandBody {
  name: string;
  slug?: string;
  description?: string;
  logoMediaId?: string | null;
  websiteUrl?: string;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export const brandApi = {
  list: (params: ListBrandsParams = {}) =>
    apiFetch<Paginated<Brand>>(`/admin/brands${toQueryString(params)}`),
  /** Public brand list (active) — for storefront filters. No auth. */
  listPublic: (params: ListBrandsParams = {}) =>
    apiFetch<Paginated<Brand>>(`/brands${toQueryString(params)}`, { auth: false }),
  create: (body: BrandBody) => apiFetch<Brand>('/admin/brands', { method: 'POST', body }),
  update: (id: string, body: BrandBody) =>
    apiFetch<Brand>(`/admin/brands/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/brands/${id}`, { method: 'DELETE' }),
};
