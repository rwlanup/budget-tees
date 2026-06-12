'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productKeys } from '@/modules/product/queries';
import {
  skuApi,
  type CreateSkuBody,
  type UpdateSkuBody,
  type GenerateBody,
  type AdjustBody,
} from './api';

export const skuKeys = {
  all: ['skus'] as const,
  forProduct: (productId: string) => ['skus', 'product', productId] as const,
  detail: (id: string) => ['skus', 'detail', id] as const,
  movements: (id: string) => ['skus', 'movements', id] as const,
  lowStock: ['skus', 'low-stock'] as const,
  lowStockCount: ['skus', 'low-stock', 'count'] as const,
};

export function useProductSkus(productId: string) {
  return useQuery({
    queryKey: skuKeys.forProduct(productId),
    queryFn: () => skuApi.listForProduct(productId),
    enabled: !!productId,
  });
}

export function useSkuMovements(id: string, enabled = true) {
  return useQuery({
    queryKey: skuKeys.movements(id),
    queryFn: () => skuApi.movements(id),
    enabled: !!id && enabled,
  });
}

export function useLowStock() {
  return useQuery({ queryKey: skuKeys.lowStock, queryFn: () => skuApi.lowStock() });
}

/** Count of low-stock SKUs — for the admin sidebar badge. */
export function useLowStockCount() {
  return useQuery({ queryKey: skuKeys.lowStockCount, queryFn: () => skuApi.lowStockCount() });
}

/** Shared invalidation: a product's SKU list, low-stock, and the product (default SKU). */
function useSkuInvalidation(productId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: skuKeys.forProduct(productId) });
    qc.invalidateQueries({ queryKey: skuKeys.lowStock });
    qc.invalidateQueries({ queryKey: skuKeys.lowStockCount });
    qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
  };
}

export function useGenerateSkus(productId: string) {
  const invalidate = useSkuInvalidation(productId);
  return useMutation({
    mutationFn: (body: GenerateBody) => skuApi.generate(productId, body),
    onSuccess: invalidate,
  });
}

export function useCreateSku(productId: string) {
  const invalidate = useSkuInvalidation(productId);
  return useMutation({
    mutationFn: (body: CreateSkuBody) => skuApi.create(productId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateSku(productId: string) {
  const invalidate = useSkuInvalidation(productId);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateSkuBody }) => skuApi.update(id, body),
    onSuccess: invalidate,
  });
}

export function useAdjustStock(productId: string) {
  const invalidate = useSkuInvalidation(productId);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdjustBody }) => skuApi.adjustStock(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteSku(productId: string) {
  const invalidate = useSkuInvalidation(productId);
  return useMutation({
    mutationFn: (id: string) => skuApi.remove(id),
    onSuccess: invalidate,
  });
}
