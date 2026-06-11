import { Order } from '../../order/entities/order.entity';
import { Payment } from '../entities/payment.entity';

/** Normalized gateway status (eSewa ePay maps COMPLETE→SUCCESS, FULL_REFUND→REVERTED, etc). */
export type GatewayStatusValue =
  | 'BOOKED'
  | 'SUCCESS'
  | 'PENDING'
  | 'FAILED'
  | 'CANCELED'
  | 'REVERTED'
  | 'UNKNOWN';

export interface GatewayInitiation {
  /** Lookup key echoed back on the callback (eSewa ePay transaction_uuid = payment.id). */
  gatewayRef: string;
  /** Where to send the shopper (eSewa ePay v2 signed form POST). */
  redirect: { url: string; method: 'GET' | 'POST'; fields?: Record<string, string> };
  raw: unknown;
}

export interface GatewayCallbackVerification {
  signatureValid: boolean;
  status: GatewayStatusValue;
  /** Matches the value stored in `payment.gatewayRef`. */
  gatewayRef: string;
  referenceCode?: string;
  raw: unknown;
}

export interface GatewayStatusResult {
  status: GatewayStatusValue;
  referenceCode?: string;
  raw: unknown;
}

export interface PaymentGateway {
  readonly name: string;
  /** Build the signed redirect (eSewa ePay v2 form POST). */
  initiate(order: Order, payment: Payment): Promise<GatewayInitiation>;
  /** Verify the redirect callback signature (decoded base64 `data`) and extract its status. */
  verifyCallback(payload: Record<string, unknown>): GatewayCallbackVerification;
  /** Authoritative server-side status check by transaction_uuid + total_amount. */
  checkStatus(transactionUuid: string, totalAmount: number): Promise<GatewayStatusResult>;
}
