import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { User, UserStatus } from './types';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatus;
  roleId?: string;
}

export interface CreateUserBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId?: string;
  status?: UserStatus;
}

export interface UpdateUserBody {
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roleId?: string;
}

export const userApi = {
  list: (params: ListUsersParams = {}) =>
    apiFetch<Paginated<User>>(`/users${toQueryString(params)}`),

  get: (id: string) => apiFetch<User>(`/users/${id}`),

  create: (body: CreateUserBody) => apiFetch<User>('/users', { method: 'POST', body }),

  update: (id: string, body: UpdateUserBody) =>
    apiFetch<User>(`/users/${id}`, { method: 'PATCH', body }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/users/${id}`, { method: 'DELETE' }),
};
