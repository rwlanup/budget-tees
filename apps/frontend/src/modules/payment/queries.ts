'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderKeys } from '@/modules/order/queries';
import { paymentApi, type ListPaymentsParams, type RefundBody } from './api';

export const paymentKeys = {
  all: ['payments'] as const,
  list: (params: ListPaymentsParams) => [...paymentKeys.all, 'list', params] as const,
};

export function usePayments(params: ListPaymentsParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => paymentApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RefundBody }) => paymentApi.refund(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

/** Admin records an order as paid (COD collected / offline). Confirms a pending order server-side. */
export function useMarkOrderPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => paymentApi.markOrderPaid(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
