'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogApi } from './api';
import type { VariantListParams } from './types';

export const catalogKeys = {
  all: ['catalog'] as const,
  variants: (params: VariantListParams) => [...catalogKeys.all, 'variants', params] as const,
  product: (idOrSlug: string) => [...catalogKeys.all, 'product', idOrSlug] as const,
};

export function useVariants(params: VariantListParams) {
  return useQuery({
    queryKey: catalogKeys.variants(params),
    queryFn: () => catalogApi.variants(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useProductDetail(idOrSlug: string) {
  return useQuery({
    queryKey: catalogKeys.product(idOrSlug),
    queryFn: () => catalogApi.productDetail(idOrSlug),
    enabled: !!idOrSlug,
    staleTime: 30_000,
  });
}

export function useFeatured() {
  return useQuery({
    queryKey: [...catalogKeys.all, 'featured'] as const,
    queryFn: () => catalogApi.featured(),
    staleTime: 5 * 60_000,
  });
}

/** Top tags by in-stock product count (homepage quick links). */
export function useTopTags() {
  return useQuery({
    queryKey: [...catalogKeys.all, 'top-tags'] as const,
    queryFn: () => catalogApi.topTags(),
    staleTime: 5 * 60_000,
  });
}

/** Product gallery (for wishlist/related thumbnails). Returns the primary image url. */
export function useProductPrimaryImage(productId: string) {
  return useQuery({
    queryKey: [...catalogKeys.all, 'media', productId] as const,
    queryFn: () => catalogApi.productMedia(productId),
    enabled: !!productId,
    staleTime: 5 * 60_000,
    select: (rows) => {
      const primary = rows.find((r) => r.isPrimary) ?? rows[0];
      if (!primary) return null;
      const medium = primary.variants.find((v) => v.variant === 'MEDIUM');
      return medium?.url ?? primary.url ?? null;
    },
  });
}
