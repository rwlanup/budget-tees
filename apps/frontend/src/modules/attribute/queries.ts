'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attributeApi, type AttributeBody, type ValueBody } from './api';

export const attributeKeys = {
  all: ['attributes'] as const,
  detail: (id: string) => ['attributes', 'detail', id] as const,
};

export function useAttributes() {
  return useQuery({ queryKey: attributeKeys.all, queryFn: () => attributeApi.list() });
}

export function useAttribute(id: string) {
  return useQuery({
    queryKey: attributeKeys.detail(id),
    queryFn: () => attributeApi.get(id),
    enabled: !!id,
  });
}

export function useCreateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AttributeBody) => attributeApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: attributeKeys.all }),
  });
}

export function useUpdateAttribute(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<AttributeBody, 'type'>) => attributeApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: attributeKeys.all }),
  });
}

export function useDeleteAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attributeApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: attributeKeys.all }),
  });
}

function invalidateAttr(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: attributeKeys.detail(id) });
  qc.invalidateQueries({ queryKey: attributeKeys.all });
}

export function useAddValue(attributeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ValueBody) => attributeApi.addValue(attributeId, body),
    onSuccess: () => invalidateAttr(qc, attributeId),
  });
}

export function useUpdateValue(attributeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ valueId, body }: { valueId: string; body: ValueBody }) =>
      attributeApi.updateValue(attributeId, valueId, body),
    onSuccess: () => invalidateAttr(qc, attributeId),
  });
}

export function useDeleteValue(attributeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (valueId: string) => attributeApi.removeValue(attributeId, valueId),
    onSuccess: () => invalidateAttr(qc, attributeId),
  });
}
