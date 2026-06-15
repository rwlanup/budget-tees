import { apiFetch } from '@/lib/api/client';
import type { AuthUser } from '@/lib/auth/auth-store';
import type { AddressType, UserAddress } from './types';

export interface AddressBody {
  type: AddressType;
  label?: string;
  recipientName: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  countryCode: string;
  postalCode?: string;
  nearestLandmark?: string;
  isDefault?: boolean;
}

export const addressApi = {
  list: () => apiFetch<UserAddress[]>('/users/me/addresses'),
  create: (body: AddressBody) =>
    apiFetch<UserAddress>('/users/me/addresses', { method: 'POST', body }),
  update: (id: string, body: Partial<AddressBody>) =>
    apiFetch<UserAddress>(`/users/me/addresses/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/users/me/addresses/${id}`, { method: 'DELETE' }),
};

export const profileApi = {
  update: (body: { firstName?: string; lastName?: string; avatarMediaId?: string }) =>
    apiFetch<AuthUser>('/users/me', { method: 'PATCH', body }),
  deactivate: () => apiFetch<{ deactivated: boolean }>('/users/me/deactivate', { method: 'POST' }),
};
