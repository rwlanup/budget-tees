'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { featuredApi, type AddFeaturedBody, type UpdateFeaturedBody } from './api';

export const featuredKeys = {
  all: ['featured'] as const,
};

export function useFeatured() {
  return useQuery({ queryKey: featuredKeys.all, queryFn: () => featuredApi.list() });
}

export function useAddFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddFeaturedBody) => featuredApi.add(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: featuredKeys.all }),
  });
}

export function useUpdateFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateFeaturedBody }) =>
      featuredApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: featuredKeys.all }),
  });
}

export function useRemoveFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => featuredApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: featuredKeys.all }),
  });
}
