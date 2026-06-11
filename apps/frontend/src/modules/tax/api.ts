import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { TaxClass, TaxRate } from './types';

export interface CreateClassBody {
  name: string;
  slug?: string;
  isDefault?: boolean;
  isActive?: boolean;
}
export interface UpdateClassBody {
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface RateFilters {
  taxClassId?: string;
  countryCode?: string;
}
export interface CreateRateBody {
  taxClassId: string;
  name: string;
  countryCode: string;
  rate: number;
  isActive?: boolean;
}
export interface UpdateRateBody {
  name?: string;
  rate?: number;
  isActive?: boolean;
}

export const taxClassApi = {
  list: () => apiFetch<TaxClass[]>('/admin/tax-classes'),
  create: (body: CreateClassBody) =>
    apiFetch<TaxClass>('/admin/tax-classes', { method: 'POST', body }),
  update: (id: string, body: UpdateClassBody) =>
    apiFetch<TaxClass>(`/admin/tax-classes/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/tax-classes/${id}`, { method: 'DELETE' }),
};

export const taxRateApi = {
  list: (filters: RateFilters = {}) =>
    apiFetch<TaxRate[]>(`/admin/tax-rates${toQueryString(filters)}`),
  create: (body: CreateRateBody) => apiFetch<TaxRate>('/admin/tax-rates', { method: 'POST', body }),
  update: (id: string, body: UpdateRateBody) =>
    apiFetch<TaxRate>(`/admin/tax-rates/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/tax-rates/${id}`, { method: 'DELETE' }),
};
