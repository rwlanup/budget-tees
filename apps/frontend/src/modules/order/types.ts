import type { Payment } from '@/modules/payment/types';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'RETURNED';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type FulfillmentMethod = 'DELIVERY' | 'PICKUP';
export type PaymentMethod = 'ESEWA' | 'COD';

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'CANCELLED',
  'REFUNDED',
  'RETURNED',
];
export const PAYMENT_STATUSES: PaymentStatus[] = [
  'UNPAID',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
];
export const FULFILLMENT_METHODS: FulfillmentMethod[] = ['DELIVERY', 'PICKUP'];

/** Address snapshot stored on the order (jsonb). */
export interface AddressSnapshot {
  recipientName?: string;
  phone?: string;
  email?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  countryCode?: string;
  postalCode?: string;
  nearestLandmark?: string;
}

export interface OrderItem {
  id: string;
  skuId: string;
  productId: string;
  productName: string;
  skuCode: string;
  variant: Record<string, string> | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  taxAmount: number;
  lineTotal: number;
}

/** Mirrors backend Order entity (items eager). */
export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  currency: string;
  shippingAddress: AddressSnapshot | null;
  billingAddress: AddressSnapshot | null;
  pickupLocationId: string | null;
  pickupLocation: Record<string, unknown> | null;
  contactEmail: string;
  contactPhone: string;
  subtotal: number;
  discountTotal: number;
  couponId: string | null;
  couponCode: string | null;
  shippingCost: number;
  taxTotal: number;
  saleSavings: number;
  grandTotal: number;
  customerNote: string | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  placedAt: string | null;
  paidAt: string | null;
  items: OrderItem[];
  /** Payment attempts/records — present on detail endpoints only (omitted from list responses). */
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

// --- transition state machine (mirrors backend order-status.service) ---
const BASE: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
};
const DELIVERY: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
};
const PICKUP: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PROCESSING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP'],
};

/** Allowed next statuses for a given status + fulfillment method. */
export function allowedTransitions(status: OrderStatus, method: FulfillmentMethod): OrderStatus[] {
  const methodMap = method === 'PICKUP' ? PICKUP : DELIVERY;
  return [...(BASE[status] ?? []), ...(methodMap[status] ?? [])];
}
