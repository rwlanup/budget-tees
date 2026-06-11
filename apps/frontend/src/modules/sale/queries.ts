'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { saleApi, type ListSalesParams, type CreateSaleBody, type UpdateSaleBody } from './api';

export const saleKeys = {
  all: ['sales'] as const,
  list: (params: ListSalesParams) => [...saleKeys.all, 'list', params] as const,
  detail: (id: string) => [...saleKeys.all, 'detail', id] as const,
};

export function useSales(params: ListSalesParams) {
  return useQuery({
    queryKey: saleKeys.list(params),
    queryFn: () => saleApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: saleKeys.detail(id),
    queryFn: () => saleApi.get(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSaleBody) => saleApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: saleKeys.all }),
  });
}

export function useUpdateSale(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSaleBody) => saleApi.update(id, body),
    onSuccess: (s) => {
      qc.setQueryData(saleKeys.detail(id), s);
      qc.invalidateQueries({ queryKey: saleKeys.all });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => saleApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: saleKeys.all }),
  });
}
