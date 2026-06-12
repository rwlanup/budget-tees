import { apiFetch } from '@/lib/api/client';
import type { GenerateResult, Sku, StockMovement } from './types';

export interface CreateSkuBody {
  attributeValueIds: string[];
  name?: string;
  sku?: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  weightGrams?: number | null;
  imageMediaId?: string | null;
}

export interface UpdateSkuBody {
  name?: string;
  sku?: string;
  barcode?: string;
  price?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  lowStockThreshold?: number;
  allowBackorder?: boolean;
  weightGrams?: number | null;
  imageMediaId?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface GenerateBody {
  defaultPrice?: number;
  defaultStock?: number;
  skuCodePrefix?: string;
}

export interface AdjustBody {
  delta?: number;
  setTo?: number;
  reason: string;
}

export const skuApi = {
  listForProduct: (productId: string) => apiFetch<Sku[]>(`/products/${productId}/skus`),

  generate: (productId: string, body: GenerateBody) =>
    apiFetch<GenerateResult>(`/products/${productId}/skus/generate`, { method: 'POST', body }),

  create: (productId: string, body: CreateSkuBody) =>
    apiFetch<Sku>(`/products/${productId}/skus`, { method: 'POST', body }),

  get: (id: string) => apiFetch<Sku>(`/skus/${id}`),

  movements: (id: string) => apiFetch<StockMovement[]>(`/skus/${id}/movements`),

  update: (id: string, body: UpdateSkuBody) =>
    apiFetch<Sku>(`/skus/${id}`, { method: 'PATCH', body }),

  adjustStock: (id: string, body: AdjustBody) =>
    apiFetch<Sku>(`/skus/${id}/adjust-stock`, { method: 'PATCH', body }),

  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/skus/${id}`, { method: 'DELETE' }),

  lowStock: () => apiFetch<Sku[]>('/skus/low-stock'),

  lowStockCount: () => apiFetch<{ count: number }>('/skus/low-stock/count'),
};
