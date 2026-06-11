import type { Order, PaymentMethod } from '@/modules/order/types';

export type PaymentRecordStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

/** Mirrors backend PaymentRefund entity. */
export interface PaymentRefund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  externalRef: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** Mirrors backend Payment entity. */
export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentRecordStatus;
  amount: number;
  currency: string;
  gatewayRef: string | null;
  gatewayTxnId: string | null;
  initiatedAt: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Recorded refunds — embedded on the admin order detail response. */
  refunds?: PaymentRefund[];
  order?: Order;
}

export function isRefundable(p: Payment): boolean {
  return p.status === 'SUCCESS' || p.status === 'PARTIALLY_REFUNDED';
}

export function isCodSettleable(p: Payment): boolean {
  return p.method === 'COD' && (p.status === 'PENDING' || p.status === 'INITIATED');
}
