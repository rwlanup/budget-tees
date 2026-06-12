import { createHmac } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../order/entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { retry } from '../../../common/utils/retry';
import {
  GatewayCallbackVerification,
  GatewayInitiation,
  GatewayStatusResult,
  GatewayStatusValue,
  PaymentGateway,
} from './payment-gateway.interface';

/** eSewa ePay v2 status → normalized gateway status. */
const EPAY_STATUS_MAP: Record<string, GatewayStatusValue> = {
  COMPLETE: 'SUCCESS',
  PENDING: 'PENDING',
  AMBIGUOUS: 'PENDING',
  CANCELED: 'CANCELED',
  NOT_FOUND: 'CANCELED',
  FULL_REFUND: 'REVERTED',
  PARTIAL_REFUND: 'UNKNOWN', // partial handled by admin refunds, not auto-applied
};

/**
 * eSewa ePay v2.
 * - initiate: signed (HMAC-SHA256 base64 over `total_amount,transaction_uuid,product_code`)
 *   form POST to the ePay form URL; the shopper pays and is redirected to success/failure_url.
 * - callback: eSewa appends `?data=<base64 json>` to success_url; verify the signature over the
 *   response's `signed_field_names` and map `status` (COMPLETE → SUCCESS).
 * - checkStatus: GET the transaction status API by product_code + total_amount + transaction_uuid.
 */
@Injectable()
export class EsewaGateway implements PaymentGateway {
  readonly name = 'esewa';
  private readonly logger = new Logger(EsewaGateway.name);

  constructor(private readonly config: ConfigService) {}

  private get productCode(): string {
    return this.config.get<string>('payment.esewa.productCode')!;
  }

  /** HMAC-SHA256 over `field=value,field=value` (signed_field_names order), base64-encoded. */
  private sign(payload: Record<string, string | number>, fields: string[]): string {
    const secret = this.config.get<string>('payment.esewa.secret')!;
    const message = fields.map((f) => `${f}=${payload[f]}`).join(',');
    return createHmac('sha256', secret).update(message).digest('base64');
  }

  private mapStatus(raw: unknown): GatewayStatusValue {
    return EPAY_STATUS_MAP[String(raw ?? '').toUpperCase()] ?? 'UNKNOWN';
  }

  async initiate(order: Order, payment: Payment): Promise<GatewayInitiation> {
    const productCode = this.productCode;
    const totalAmount = order.grandTotal.toFixed(2);
    const transactionUuid = payment.id;
    const baseReturn = this.config.get<string>('payment.baseReturnUrl');
    const signature = this.sign(
      { total_amount: totalAmount, transaction_uuid: transactionUuid, product_code: productCode },
      ['total_amount', 'transaction_uuid', 'product_code'],
    );

    return {
      gatewayRef: transactionUuid,
      redirect: {
        url: this.config.get<string>('payment.esewa.formUrl')!,
        method: 'POST',
        fields: {
          amount: totalAmount,
          tax_amount: '0',
          total_amount: totalAmount,
          transaction_uuid: transactionUuid,
          product_code: productCode,
          product_service_charge: '0',
          product_delivery_charge: '0',
          success_url: `${baseReturn}/esewa/callback`,
          failure_url: `${baseReturn}/esewa/callback?status=failure&order=${encodeURIComponent(order.orderNumber)}`,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature,
        },
      },
      raw: { transactionUuid },
    };
  }

  verifyCallback(payload: Record<string, unknown>): GatewayCallbackVerification {
    const dataB64 = payload.data as string | undefined;
    if (!dataB64) {
      // Failure/cancel redirect carries no signed `data`.
      return {
        signatureValid: false,
        status: 'CANCELED',
        gatewayRef: String(payload.transaction_uuid ?? ''),
        raw: payload,
      };
    }

    let decoded: Record<string, unknown>;
    try {
      decoded = JSON.parse(Buffer.from(dataB64, 'base64').toString('utf8'));
    } catch {
      return { signatureValid: false, status: 'UNKNOWN', gatewayRef: '', raw: payload };
    }

    const fields = String(decoded.signed_field_names ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    const flat: Record<string, string | number> = {};
    for (const f of fields) flat[f] = decoded[f] as string | number;
    const expected = fields.length ? this.sign(flat, fields) : '';

    return {
      signatureValid: !!expected && expected === decoded.signature,
      status: this.mapStatus(decoded.status),
      gatewayRef: String(decoded.transaction_uuid ?? ''),
      referenceCode: decoded.transaction_code ? String(decoded.transaction_code) : undefined,
      raw: decoded,
    };
  }

  async checkStatus(transactionUuid: string, totalAmount: number): Promise<GatewayStatusResult> {
    const base = this.config.get<string>('payment.esewa.statusUrl')!;
    const params = new URLSearchParams({
      product_code: this.productCode,
      total_amount: totalAmount.toFixed(2),
      transaction_uuid: transactionUuid,
    });

    try {
      const json = await retry(
        async () => {
          const res = await fetch(`${base}?${params.toString()}`);
          if (res.status === 429 || res.status >= 500) throw new Error(`eSewa HTTP ${res.status}`);
          return (await res.json().catch(() => ({}))) as { status?: string; ref_id?: string };
        },
        {
          retries: 3,
          baseDelayMs: 400,
          onRetry: (err, attempt, delay) =>
            this.logger.warn(`eSewa status retry #${attempt} in ${delay}ms: ${String(err)}`),
        },
      );
      return { status: this.mapStatus(json.status), referenceCode: json.ref_id, raw: json };
    } catch (err) {
      // Status checks are polled — stay non-fatal after retries are exhausted.
      this.logger.warn(`eSewa status check errored for ${transactionUuid}: ${String(err)}`);
      return { status: 'UNKNOWN', raw: { error: String(err) } };
    }
  }
}
