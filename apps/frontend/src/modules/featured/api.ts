import { apiFetch } from '@/lib/api/client';
import type { FeaturedProduct } from './types';

export interface AddFeaturedBody {
  productId: string;
  sortOrder?: number;
}

export interface UpdateFeaturedBody {
  isActive?: boolean;
  sortOrder?: number;
}

export const featuredApi = {
  list: () => apiFetch<FeaturedProduct[]>('/admin/featured-products'),
  add: (body: AddFeaturedBody) =>
    apiFetch<FeaturedProduct>('/admin/featured-products', { method: 'POST', body }),
  update: (id: string, body: UpdateFeaturedBody) =>
    apiFetch<FeaturedProduct>(`/admin/featured-products/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/featured-products/${id}`, { method: 'DELETE' }),
};
