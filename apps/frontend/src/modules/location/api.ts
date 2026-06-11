import { apiFetch } from '@/lib/api/client';
import type { PickupLocation, ShippingZone } from './types';

export interface PickupBody {
  name: string;
  phone?: string;
  email?: string;
  line1: string;
  city: string;
  region?: string;
  countryCode: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  openingHours?: Record<string, unknown>;
  isActive?: boolean;
}

export interface ZoneBody {
  name: string;
  countryCode: string;
  isCountryWide?: boolean;
  regions?: string[];
  flatRate: number;
  freeShippingThreshold?: number | null;
  isActive?: boolean;
  sortOrder?: number;
}

export const pickupApi = {
  list: () => apiFetch<PickupLocation[]>('/admin/pickup-locations'),
  create: (body: PickupBody) =>
    apiFetch<PickupLocation>('/admin/pickup-locations', { method: 'POST', body }),
  update: (id: string, body: Partial<PickupBody>) =>
    apiFetch<PickupLocation>(`/admin/pickup-locations/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/pickup-locations/${id}`, { method: 'DELETE' }),
};

export const zoneApi = {
  list: () => apiFetch<ShippingZone[]>('/admin/shipping-zones'),
  create: (body: ZoneBody) =>
    apiFetch<ShippingZone>('/admin/shipping-zones', { method: 'POST', body }),
  update: (id: string, body: Partial<ZoneBody>) =>
    apiFetch<ShippingZone>(`/admin/shipping-zones/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/shipping-zones/${id}`, { method: 'DELETE' }),
};
