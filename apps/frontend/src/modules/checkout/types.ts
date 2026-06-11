import type { FulfillmentMethod, PaymentMethod } from '@/modules/order/types';

export interface AddressInput {
  recipientName: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  countryCode: string;
  postalCode?: string;
  nearestLandmark?: string;
}

/** Mirrors backend CheckoutDto. */
export interface CheckoutBody {
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod: PaymentMethod;
  shippingAddress?: AddressInput;
  billingAddress?: AddressInput;
  pickupLocationId?: string;
  contactEmail: string;
  contactPhone: string;
  couponCode?: string;
  customerNote?: string;
}

export interface PickupLocation {
  id: string;
  name: string;
  phone: string | null;
  line1: string;
  city: string;
  region: string | null;
  countryCode: string;
  postalCode: string | null;
  isActive: boolean;
}

export interface ShippingQuote {
  method: FulfillmentMethod;
  shippingCost: number;
  freeApplied: boolean;
  zone: unknown;
}

export interface CouponPreview {
  valid: true;
  code: string;
  type: string;
  discountAmount: number;
  freeShipping: boolean;
  eligibleSubtotal: number;
}

export interface GatewayRedirect {
  url: string;
  method: 'GET' | 'POST';
  fields?: Record<string, string>;
}

/** Response of POST /payments/initiate (COD vs online gateway). */
export interface InitiateResponse {
  paymentId: string;
  method?: PaymentMethod;
  status?: string;
  orderStatus?: string;
  gatewayRef?: string;
  redirect?: GatewayRedirect;
}
