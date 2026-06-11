import { apiFetch } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type { Permission, Role } from './types';

export interface ListRolesParams {
  page?: number;
  limit?: number;
  search?: string;
}

function toQuery(params: object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const roleApi = {
  list: (params: ListRolesParams = {}) => apiFetch<Paginated<Role>>(`/roles${toQuery(params)}`),

  get: (id: string) => apiFetch<Role>(`/roles/${id}`),

  create: (body: { name: string; description?: string; permissionKeys?: string[] }) =>
    apiFetch<Role>('/roles', { method: 'POST', body }),

  update: (id: string, body: { description?: string }) =>
    apiFetch<Role>(`/roles/${id}`, { method: 'PATCH', body }),

  setPermissions: (id: string, permissionKeys: string[]) =>
    apiFetch<Role>(`/roles/${id}/permissions`, { method: 'PUT', body: { permissionKeys } }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/roles/${id}`, { method: 'DELETE' }),
};

export const permissionApi = {
  list: (group?: string) => apiFetch<Permission[]>(`/permissions${group ? `?group=${group}` : ''}`),
};
