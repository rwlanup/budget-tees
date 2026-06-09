import { createHmac } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order } from '../../order/entities/order.entity';
import { Payment } from '../entities/payment.entity';
import { GatewayInitiation, GatewayVerification, PaymentGateway } from './payment-gateway.interface';

/** eSewa ePay v2: signed form POST redirect, success returns base64 `data` to verify. */
@Injectable()
export class EsewaGateway implements PaymentGateway {
  readonly name = 'esewa';

  constructor(private readonly config: ConfigService) {}

  private sign(message: string): string {
    const secret = this.config.get<string>('payment.esewa.secret')!;
    return createHmac('sha256', secret).update(message).digest('base64');
  }

  async initiate(order: Order, payment: Payment): Promise<GatewayInitiation> {
    const productCode = this.config.get<string>('payment.esewa.productCode')!;
    const totalAmount = order.grandTotal.toFixed(2);
    const transactionUuid = payment.id;
    const signed = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = this.sign(signed);
    const returnUrl = `${this.config.get<string>('payment.baseReturnUrl')}/esewa/callback`;
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
          success_url: returnUrl,
          failure_url: `${returnUrl}?status=failure`,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature,
        },
      },
    };
  }

  async verify(payload: Record<string, unknown>): Promise<GatewayVerification> {
    // eSewa returns ?data=<base64 json> on success.
    const dataB64 = payload.data as string | undefined;
    if (!dataB64) {
      return { gatewayRef: (payload.transaction_uuid as string) ?? '', success: false, raw: payload };
    }
    const decoded = JSON.parse(Buffer.from(dataB64, 'base64').toString('utf8'));
    const fields: string[] = (decoded.signed_field_names as string).split(',');
    const message = fields.map((f) => `${f}=${decoded[f]}`).join(',');
    const expected = this.sign(message);
    const signatureValid = expected === decoded.signature;
    return {
      gatewayRef: decoded.transaction_uuid,
      success: signatureValid && decoded.status === 'COMPLETE',
      gatewayTxnId: decoded.transaction_code,
      raw: decoded,
    };
  }
}
