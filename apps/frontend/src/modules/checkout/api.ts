import { apiFetch } from '@/lib/api/client';
import { getCartToken } from '@/lib/storefront/cart-token';
import type { Paginated } from '@/types/api';
import type { Order, FulfillmentMethod, PaymentMethod } from '@/modules/order/types';
import type {
  CheckoutBody,
  CouponPreview,
  InitiateResponse,
  PickupLocation,
  ShippingQuote,
} from './types';

/** Customer-facing order endpoints (distinct from admin /admin/orders). */
export const customerOrderApi = {
  checkout: (body: CheckoutBody, idempotencyKey: string) =>
    apiFetch<Order>('/orders/checkout', { method: 'POST', body, idempotencyKey }),

  get: (idOrNumber: string) => apiFetch<Order>(`/orders/${idOrNumber}`),

  list: (query: { page?: number; limit?: number; status?: string } = {}) => {
    const sp = new URLSearchParams();
    if (query.page) sp.set('page', String(query.page));
    if (query.limit) sp.set('limit', String(query.limit));
    if (query.status) sp.set('status', query.status);
    const qs = sp.toString();
    return apiFetch<Paginated<Order>>(`/orders${qs ? `?${qs}` : ''}`);
  },

  cancel: (idOrNumber: string) =>
    apiFetch<Order>(`/orders/${idOrNumber}/cancel`, { method: 'POST' }),
};

export const paymentApi = {
  initiate: (orderId: string, method: PaymentMethod, idempotencyKey?: string) =>
    apiFetch<InitiateResponse>('/payments/initiate', {
      method: 'POST',
      body: { orderId, method },
      idempotencyKey,
    }),

  /** Active eSewa status reconcile for an order; returns the order's current payment status. */
  reconcile: (idOrNumber: string) =>
    apiFetch<{ orderNumber: string; paymentStatus: string }>(
      `/payments/order/${idOrNumber}/status`,
    ),
};

export const checkoutApi = {
  pickupLocations: () => apiFetch<PickupLocation>('/pickup-locations/active', { auth: false }),

  shippingQuote: (body: {
    method: FulfillmentMethod;
    subtotal: number;
    countryCode?: string;
    region?: string;
  }) => apiFetch<ShippingQuote>('/shipping/quote', { method: 'POST', body, auth: false }),

  validateCoupon: (code: string) => {
    const token = getCartToken();
    const headers: Record<string, string> = token ? { 'x-cart-token': token } : {};
    return apiFetch<CouponPreview>('/coupons/validate', {
      method: 'POST',
      body: { code },
      headers,
    });
  },
};
