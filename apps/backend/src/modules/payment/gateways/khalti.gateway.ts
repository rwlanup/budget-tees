import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../order/entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { GatewayInitiation, GatewayVerification, PaymentGateway } from './payment-gateway.interface';

/** Khalti ePayment: server-initiated, redirect to payment_url, verified via server lookup by pidx. */
@Injectable()
export class KhaltiGateway implements PaymentGateway {
  readonly name = 'khalti';

  constructor(private readonly config: ConfigService) {}

  private get authHeader() {
    return { Authorization: `Key ${this.config.get<string>('payment.khalti.secret')}` };
  }

  async initiate(order: Order, payment: Payment): Promise<GatewayInitiation> {
    const base = this.config.get<string>('payment.khalti.baseUrl');
    const res = await fetch(`${base}/epayment/initiate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeader },
      body: JSON.stringify({
        return_url: `${this.config.get<string>('payment.baseReturnUrl')}/khalti/callback`,
        website_url: this.config.get<string>('payment.websiteUrl'),
        amount: Math.round(order.grandTotal * 100), // paisa
        purchase_order_id: order.orderNumber,
        purchase_order_name: order.orderNumber,
      }),
    });
    const body = (await res.json()) as { pidx: string; payment_url: string };
    if (!res.ok || !body.pidx) {
      throw new Error(`Khalti initiate failed: ${JSON.stringify(body)}`);
    }
    return {
      gatewayRef: body.pidx,
      redirect: { url: body.payment_url, method: 'GET' },
      raw: body,
    };
  }

  async verify(payload: Record<string, unknown>): Promise<GatewayVerification> {
    const pidx = payload.pidx as string;
    const base = this.config.get<string>('payment.khalti.baseUrl');
    const res = await fetch(`${base}/epayment/lookup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeader },
      body: JSON.stringify({ pidx }),
    });
    const body = (await res.json()) as { status: string; transaction_id?: string };
    return {
      gatewayRef: pidx,
      success: body.status === 'Completed',
      gatewayTxnId: body.transaction_id,
      raw: body,
    };
  }
}
