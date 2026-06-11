import { apiFetch } from '@/lib/api/client';
import type { Category } from './types';

export interface CategoryBody {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  imageMediaId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export const categoryApi = {
  tree: () => apiFetch<Category[]>('/categories/tree'),

  get: (idOrSlug: string) => apiFetch<Category>(`/categories/${idOrSlug}`, { auth: false }),

  create: (body: CategoryBody) => apiFetch<Category>('/categories', { method: 'POST', body }),

  update: (id: string, body: Omit<CategoryBody, 'parentId'>) =>
    apiFetch<Category>(`/categories/${id}`, { method: 'PATCH', body }),

  move: (id: string, newParentId: string | null) =>
    apiFetch<Category>(`/categories/${id}/move`, { method: 'PATCH', body: { newParentId } }),

  remove: (id: string, cascade = false) =>
    apiFetch<{ deleted: boolean }>(`/categories/${id}${cascade ? '?cascade=true' : ''}`, {
      method: 'DELETE',
    }),
};
