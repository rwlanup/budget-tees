'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi, type ListOrdersParams } from './api';
import type { OrderStatus } from './types';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: ListOrdersParams) => [...orderKeys.all, 'list', params] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useOrders(params: ListOrdersParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => orderApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderApi.get(id),
    enabled: !!id,
  });
}

export function useUpdateStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) =>
      orderApi.updateStatus(id, status, note),
    onSuccess: (order) => {
      qc.setQueryData(orderKeys.detail(id), order);
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useFulfillment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      status: OrderStatus;
      trackingCarrier?: string;
      trackingNumber?: string;
    }) => orderApi.fulfillment(id, body),
    onSuccess: (order) => {
      qc.setQueryData(orderKeys.detail(id), order);
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
