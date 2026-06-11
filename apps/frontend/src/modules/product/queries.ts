'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  productApi,
  type ListProductsParams,
  type ProductBody,
  type GalleryItem,
  type AttributeAssignmentItem,
} from './api';
import type { ProductStatus } from './types';

export const productKeys = {
  all: ['products'] as const,
  list: (params: ListProductsParams) => [...productKeys.all, 'list', params] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
  media: (id: string) => [...productKeys.all, 'media', id] as const,
  attributes: (id: string) => [...productKeys.all, 'attributes', id] as const,
};

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.list(params),
    placeholderData: (prev) => prev,
  });
}

/** Product options for selects in other modules (capped — first 100 by name). */
export function useProductOptions() {
  return useQuery({
    queryKey: productKeys.list({ page: 1, limit: 100, sort: 'name' }),
    queryFn: () => productApi.list({ page: 1, limit: 100, sort: 'name' }),
    staleTime: 60_000,
    select: (data) => data.items,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.get(id),
    enabled: !!id,
  });
}

export function useProductMedia(id: string) {
  return useQuery({
    queryKey: productKeys.media(id),
    queryFn: () => productApi.getMedia(id),
    enabled: !!id,
  });
}

export function useProductAttributes(id: string) {
  return useQuery({
    queryKey: productKeys.attributes(id),
    queryFn: () => productApi.getAttributes(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductBody) => productApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductBody) => productApi.update(id, body),
    onSuccess: (p) => {
      qc.setQueryData(productKeys.detail(id), p);
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useSetStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: ProductStatus) => productApi.setStatus(id, status),
    onSuccess: (p) => {
      qc.setQueryData(productKeys.detail(id), p);
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useSetTags(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagIds: string[]) => productApi.setTags(id, tagIds),
    onSuccess: (p) => {
      qc.setQueryData(productKeys.detail(id), p);
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useSetGallery(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: GalleryItem[]) => productApi.setMedia(id, items),
    onSuccess: (rows) => qc.setQueryData(productKeys.media(id), rows),
  });
}

export function useSetAttributes(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attributes: AttributeAssignmentItem[]) => productApi.setAttributes(id, attributes),
    onSuccess: (rows) => qc.setQueryData(productKeys.attributes(id), rows),
  });
}
