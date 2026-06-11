'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryApi, type CategoryBody } from './api';

export const categoryKeys = {
  all: ['categories'] as const,
  tree: ['categories', 'tree'] as const,
  detail: (id: string) => ['categories', 'detail', id] as const,
};

export function useCategoryTree() {
  return useQuery({ queryKey: categoryKeys.tree, queryFn: () => categoryApi.tree() });
}

/** Single category by id or slug (public) — for storefront category pages. */
export function useCategory(idOrSlug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(idOrSlug),
    queryFn: () => categoryApi.get(idOrSlug),
    enabled: !!idOrSlug,
    staleTime: 5 * 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryBody) => categoryApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<CategoryBody, 'parentId'>) => categoryApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useMoveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newParentId }: { id: string; newParentId: string | null }) =>
      categoryApi.move(id, newParentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cascade }: { id: string; cascade: boolean }) =>
      categoryApi.remove(id, cascade),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
