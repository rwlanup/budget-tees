import { Order } from '../../order/entities/order.entity';
import { Payment } from '../entities/payment.entity';

export interface GatewayInitiation {
  gatewayRef: string;
  redirect?: { url: string; method: 'GET' | 'POST'; fields?: Record<string, string> };
  raw?: unknown;
}

export interface GatewayVerification {
  gatewayRef: string;
  success: boolean;
  gatewayTxnId?: string;
  raw: unknown;
}

export interface PaymentGateway {
  readonly name: string;
  initiate(order: Order, payment: Payment): Promise<GatewayInitiation>;
  verify(payload: Record<string, unknown>): Promise<GatewayVerification>;
}
