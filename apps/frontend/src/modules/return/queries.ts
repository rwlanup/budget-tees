'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderKeys } from '@/modules/order/queries';
import { paymentKeys } from '@/modules/payment/queries';
import {
  customerReturnApi,
  returnApi,
  type CreateReturnBody,
  type ListReturnsParams,
  type ReviewBody,
  type ReceiveBody,
  type ResolveBody,
} from './api';

export const returnKeys = {
  all: ['returns'] as const,
  list: (params: ListReturnsParams) => [...returnKeys.all, 'list', params] as const,
  detail: (id: string) => [...returnKeys.all, 'detail', id] as const,
};

export function useReturns(params: ListReturnsParams) {
  return useQuery({
    queryKey: returnKeys.list(params),
    queryFn: () => returnApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useReturn(id: string) {
  return useQuery({
    queryKey: returnKeys.detail(id),
    queryFn: () => returnApi.get(id),
    enabled: !!id,
  });
}

function useReturnInvalidation(id: string) {
  const qc = useQueryClient();
  return (updated?: unknown) => {
    if (updated) qc.setQueryData(returnKeys.detail(id), updated);
    qc.invalidateQueries({ queryKey: returnKeys.all });
    qc.invalidateQueries({ queryKey: orderKeys.all });
    qc.invalidateQueries({ queryKey: paymentKeys.all });
  };
}

export function useReview(id: string) {
  const invalidate = useReturnInvalidation(id);
  return useMutation({
    mutationFn: (body: ReviewBody) => returnApi.review(id, body),
    onSuccess: (r) => invalidate(r),
  });
}

export function useReceive(id: string) {
  const invalidate = useReturnInvalidation(id);
  return useMutation({
    mutationFn: (body: ReceiveBody) => returnApi.receive(id, body),
    onSuccess: (r) => invalidate(r),
  });
}

export function useResolve(id: string) {
  const invalidate = useReturnInvalidation(id);
  return useMutation({
    mutationFn: (body: ResolveBody) => returnApi.resolve(id, body),
    onSuccess: (r) => invalidate(r),
  });
}

// --- Customer-facing hooks (own returns) ---

export const customerReturnKeys = {
  all: ['my-returns'] as const,
  list: (params: ListReturnsParams) => [...customerReturnKeys.all, 'list', params] as const,
  returnable: (orderId: string) => ['returnable', orderId] as const,
};

/** Per-order returnable lines. Enabled only when the order may have returnable items. */
export function useReturnable(orderId: string, enabled = true) {
  return useQuery({
    queryKey: customerReturnKeys.returnable(orderId),
    queryFn: () => customerReturnApi.returnable(orderId),
    enabled: !!orderId && enabled,
    staleTime: 30_000,
  });
}

/** Current user's returns (paginated). Filter by orderId client-side for an order view. */
export function useMyReturns(params: ListReturnsParams = {}) {
  return useQuery({
    queryKey: customerReturnKeys.list(params),
    queryFn: () => customerReturnApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateReturn(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReturnBody) => customerReturnApi.create(orderId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerReturnKeys.all });
      qc.invalidateQueries({ queryKey: customerReturnKeys.returnable(orderId) });
      // Reflect any payment/order status change driven by the return.
      qc.invalidateQueries({ queryKey: ['my-order'] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
}

export function useCancelReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerReturnApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerReturnKeys.all });
      qc.invalidateQueries({ queryKey: ['returnable'] });
    },
  });
}
