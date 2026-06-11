'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagApi, type ListTagsParams, type TagBody } from './api';

export const tagKeys = {
  all: ['tags'] as const,
  list: (params: ListTagsParams) => [...tagKeys.all, 'list', params] as const,
};

export function useTags(params: ListTagsParams) {
  return useQuery({
    queryKey: tagKeys.list(params),
    queryFn: () => tagApi.list(params),
    placeholderData: (prev) => prev,
  });
}

/** All tags (for the merge picker). */
export function useAllTags() {
  return useQuery({
    queryKey: tagKeys.list({ page: 1, limit: 100 }),
    queryFn: () => tagApi.list({ page: 1, limit: 100 }),
    select: (data) => data.items,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TagBody) => tagApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}

export function useUpdateTag(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TagBody) => tagApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tagApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}

export function useMergeTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceIds, targetId }: { sourceIds: string[]; targetId: string }) =>
      tagApi.merge(sourceIds, targetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tagKeys.all }),
  });
}
