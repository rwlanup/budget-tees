'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandApi, type ListBrandsParams, type BrandBody } from './api';

export const brandKeys = {
  all: ['brands'] as const,
  list: (params: ListBrandsParams) => [...brandKeys.all, 'list', params] as const,
  public: ['brands', 'public'] as const,
};

/** Active brands from the public endpoint — for storefront filters. */
export function usePublicBrands() {
  return useQuery({
    queryKey: brandKeys.public,
    queryFn: () => brandApi.listPublic({ page: 1, limit: 100 }),
    staleTime: 5 * 60_000,
    select: (data) => data.items,
  });
}

export function useBrands(params: ListBrandsParams) {
  return useQuery({
    queryKey: brandKeys.list(params),
    queryFn: () => brandApi.list(params),
    placeholderData: (prev) => prev,
  });
}

/** All active brands (for selects in Product). */
export function useBrandOptions() {
  return useQuery({
    queryKey: brandKeys.list({ page: 1, limit: 100, isActive: true }),
    queryFn: () => brandApi.list({ page: 1, limit: 100, isActive: true }),
    staleTime: 5 * 60_000,
    select: (data) => data.items,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BrandBody) => brandApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: brandKeys.all }),
  });
}

export function useUpdateBrand(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BrandBody) => brandApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: brandKeys.all }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => brandApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: brandKeys.all }),
  });
}
