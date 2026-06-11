import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { Tag } from './types';

export interface ListTagsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface TagBody {
  name: string;
  slug?: string;
  isActive?: boolean;
}

export const tagApi = {
  list: (params: ListTagsParams = {}) => apiFetch<Paginated<Tag>>(`/tags${toQueryString(params)}`),
  create: (body: TagBody) => apiFetch<Tag>('/tags', { method: 'POST', body }),
  update: (id: string, body: TagBody) => apiFetch<Tag>(`/tags/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/tags/${id}`, { method: 'DELETE' }),
  merge: (sourceIds: string[], targetId: string) =>
    apiFetch<Tag>('/tags/merge', { method: 'POST', body: { sourceIds, targetId } }),
};
