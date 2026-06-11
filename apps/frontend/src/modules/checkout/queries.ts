'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FulfillmentMethod, PaymentMethod } from '@/modules/order/types';
import { ApiError } from '@/lib/api/client';
import { checkoutApi, customerOrderApi, paymentApi } from './api';
import type { CheckoutBody } from './types';

/** Retry transient failures (network / 5xx) with exponential backoff; never retry 4xx. */
const ESEWA_RETRY = {
  retry: (failureCount: number, error: unknown) => {
    if (error instanceof ApiError && error.statusCode < 500) return false;
    return failureCount < 3;
  },
  retryDelay: (attempt: number) => Math.min(3000, 400 * 2 ** attempt),
} as const;

export interface MyOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const checkoutKeys = {
  pickup: ['pickup-locations'] as const,
  orders: (params: MyOrdersParams) => ['my-orders', params] as const,
  order: (idOrNumber: string) => ['my-order', idOrNumber] as const,
  shipping: (method: FulfillmentMethod, subtotal: number, country?: string, region?: string) =>
    ['shipping-quote', method, subtotal, country ?? '', region ?? ''] as const,
};

export function useCustomerOrders(params: MyOrdersParams) {
  return useQuery({
    queryKey: checkoutKeys.orders(params),
    queryFn: () => customerOrderApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (idOrNumber: string) => customerOrderApi.cancel(idOrNumber),
    onSuccess: (order) => {
      qc.setQueryData(checkoutKeys.order(order.orderNumber), order);
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      qc.invalidateQueries({ queryKey: ['my-order'] });
    },
  });
}

export function usePickupLocations() {
  return useQuery({
    queryKey: checkoutKeys.pickup,
    queryFn: () => checkoutApi.pickupLocations(),
    staleTime: 5 * 60_000,
  });
}

/** Customer order detail. `poll` re-fetches while payment settles after a gateway return. */
export function useCustomerOrder(idOrNumber: string, poll = false) {
  return useQuery({
    queryKey: checkoutKeys.order(idOrNumber),
    queryFn: () => customerOrderApi.get(idOrNumber),
    enabled: !!idOrNumber,
    refetchInterval: (q) => {
      if (!poll) return false;
      const data = q.state.data;
      // Poll only while an online payment is settling (COD stays UNPAID by design).
      return data && data.paymentStatus === 'UNPAID' && data.paymentMethod !== 'COD' ? 2000 : false;
    },
  });
}

export function useShippingQuote(
  method: FulfillmentMethod,
  subtotal: number,
  countryCode?: string,
  region?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: checkoutKeys.shipping(method, subtotal, countryCode, region),
    queryFn: () => checkoutApi.shippingQuote({ method, subtotal, countryCode, region }),
    enabled: enabled && subtotal > 0,
    staleTime: 60_000,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: CheckoutBody; idempotencyKey: string }) =>
      customerOrderApi.checkout(body, idempotencyKey),
  });
}

/**
 * Polls the backend eSewa status reconcile while an online payment is settling.
 * Each tick triggers a server-side status check; the order query is refreshed so the
 * result page reflects PAID/FAILED. Stops once the order leaves UNPAID.
 */
export function useReconcileEsewa(orderNumber: string, enabled: boolean) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['esewa-reconcile', orderNumber],
    queryFn: async () => {
      const res = await paymentApi.reconcile(orderNumber);
      qc.invalidateQueries({ queryKey: checkoutKeys.order(orderNumber) });
      return res;
    },
    enabled: enabled && !!orderNumber,
    refetchInterval: (q) => {
      const status = q.state.data?.paymentStatus;
      return status && status !== 'UNPAID' ? false : 2000;
    },
    ...ESEWA_RETRY,
  });
}

/**
 * Initiate is a one-shot, side-effecting redirect — it must NOT auto-retry on the client
 * (that produced a confusing double call). Transient eSewa errors are retried server-side
 * in the gateway; the idempotency key makes a manual re-click safe.
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: ({
      orderId,
      method,
      idempotencyKey,
    }: {
      orderId: string;
      method: PaymentMethod;
      idempotencyKey?: string;
    }) => paymentApi.initiate(orderId, method, idempotencyKey),
    retry: false,
  });
}

export function useValidateCoupon() {
  return useMutation({ mutationFn: (code: string) => checkoutApi.validateCoupon(code) });
}
