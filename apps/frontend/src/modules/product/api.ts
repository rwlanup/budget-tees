import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type {
  Product,
  ProductAttributeAssignment,
  ProductMediaItem,
  ProductStatus,
  ProductType,
} from './types';

export interface ListProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  sort?: 'newest' | 'oldest' | 'name';
}

export interface ProductBody {
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  brandId?: string | null;
  taxClassId?: string | null;
  type?: ProductType;
  tagIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface GalleryItem {
  mediaId: string;
  sortOrder: number;
  isPrimary?: boolean;
}

export interface AttributeAssignmentItem {
  attributeId: string;
  isVariation?: boolean;
  valueIds: string[];
}

export const productApi = {
  list: (params: ListProductsParams = {}) =>
    apiFetch<Paginated<Product>>(`/admin/products${toQueryString(params)}`),

  get: (id: string) => apiFetch<Product>(`/admin/products/${id}`),

  create: (body: ProductBody) => apiFetch<Product>('/admin/products', { method: 'POST', body }),

  update: (id: string, body: ProductBody) =>
    apiFetch<Product>(`/admin/products/${id}`, { method: 'PATCH', body }),

  setStatus: (id: string, status: ProductStatus) =>
    apiFetch<Product>(`/admin/products/${id}/status`, { method: 'PATCH', body: { status } }),

  setTags: (id: string, tagIds: string[]) =>
    apiFetch<Product>(`/admin/products/${id}/tags`, { method: 'PATCH', body: { tagIds } }),

  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/products/${id}`, { method: 'DELETE' }),

  getMedia: (id: string) => apiFetch<ProductMediaItem[]>(`/products/${id}/media`),

  setMedia: (id: string, items: GalleryItem[]) =>
    apiFetch<ProductMediaItem[]>(`/admin/products/${id}/media`, { method: 'PUT', body: { items } }),

  getAttributes: (id: string) =>
    apiFetch<ProductAttributeAssignment[]>(`/products/${id}/attributes`),

  setAttributes: (id: string, attributes: AttributeAssignmentItem[]) =>
    apiFetch<ProductAttributeAssignment[]>(`/products/${id}/attributes`, {
      method: 'PUT',
      body: { attributes },
    }),
};
