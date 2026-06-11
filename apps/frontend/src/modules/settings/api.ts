import { apiFetch } from '@/lib/api/client';
import type { PublicSettings, SettingRecord, ShippingCountry } from './types';

export interface SettingItem {
  key: string;
  value: unknown;
}

export const settingsApi = {
  /** Public store config (no auth) — used by the storefront shell. */
  getPublic: () => apiFetch<PublicSettings>('/settings/public'),

  list: (group?: string) =>
    apiFetch<SettingRecord[]>(`/admin/settings${group ? `?group=${group}` : ''}`),

  bulkUpsert: (items: SettingItem[]) =>
    apiFetch<{ updated: number }>('/admin/settings', { method: 'PUT', body: { items } }),
};

export interface CreateCountryBody {
  code: string;
  name: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCountryBody {
  name?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export const shippingCountryApi = {
  list: () => apiFetch<ShippingCountry[]>('/admin/shipping-countries'),

  /** Public list (active only) — usable without settings.manage. */
  listPublic: () => apiFetch<ShippingCountry[]>('/shipping-countries'),

  create: (body: CreateCountryBody) =>
    apiFetch<ShippingCountry>('/admin/shipping-countries', { method: 'POST', body }),

  update: (code: string, body: UpdateCountryBody) =>
    apiFetch<ShippingCountry>(`/admin/shipping-countries/${code}`, { method: 'PATCH', body }),

  remove: (code: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/shipping-countries/${code}`, { method: 'DELETE' }),
};
