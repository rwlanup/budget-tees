'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@/lib/api/client';
import { canAccessAdmin } from '@/lib/auth/auth-store';
import { useMe } from '@/modules/auth/queries';
import { useCart } from '@/modules/cart/queries';
import {
  useCreateOrder,
  useInitiatePayment,
  usePickupLocations,
  useShippingQuote,
} from '@/modules/checkout/queries';
import { gatewayRedirect } from '@/modules/checkout/gateway';
import { checkoutSchema, type CheckoutFormInput } from '@/modules/checkout/schemas';
import type { AddressInput, CouponPreview } from '@/modules/checkout/types';
import type { UserAddress } from '@/modules/account/types';

function toAddressInput(a: UserAddress): AddressInput {
  const v = (s: string | null) => (s ? s : undefined);
  return {
    recipientName: a.recipientName,
    phone: a.phone,
    email: v(a.email),
    line1: a.line1,
    line2: v(a.line2),
    city: a.city,
    region: v(a.region),
    countryCode: a.countryCode,
    postalCode: v(a.postalCode),
    nearestLandmark: v(a.nearestLandmark),
  };
}

/**
 * Owns all checkout container logic — form, selection state, prefill effects,
 * live shipping quote, and the create-order → initiate-payment flow. The view
 * is pure presentation over what this returns. No business/state logic changed.
 */
export function useCheckout() {
  const router = useRouter();
  const { data: loc } = usePickupLocations();
  const { data: user } = useMe();
  const { data: cart } = useCart();
  const createOrder = useCreateOrder();
  const initiate = useInitiatePayment();

  const [address, setAddress] = React.useState<UserAddress | null>(null);
  const [billingAddress, setBillingAddress] = React.useState<UserAddress | null>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = React.useState(true);
  const [pickupId, setPickupId] = React.useState<string | null>(null);
  const [coupon, setCoupon] = React.useState<CouponPreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const idempotencyKey = React.useRef<string>(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
  );

  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fulfillmentMethod: 'DELIVERY',
      paymentMethod: 'COD',
      contactEmail: '',
      contactPhone: '',
      customerNote: '',
    },
    mode: 'onTouched',
  });

  // Prefill contact from the user + selected address.
  React.useEffect(() => {
    if (user?.email && !form.getValues('contactEmail')) form.setValue('contactEmail', user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  React.useEffect(() => {
    if (address?.phone && !form.getValues('contactPhone'))
      form.setValue('contactPhone', address.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const method = form.watch('fulfillmentMethod');
  React.useEffect(() => {
    if (loc) {
      setPickupId(method === 'PICKUP' ? loc.id : null);
    }
  }, [method, loc]);
  const payMethod = form.watch('paymentMethod');
  const subtotal = cart?.subtotal ?? 0;
  const lines = cart?.items ?? [];

  const shippingQuote = useShippingQuote(
    'DELIVERY',
    subtotal,
    address?.countryCode,
    address?.region ?? undefined,
    method === 'DELIVERY' && !!address,
  );
  const shippingCost = method === 'PICKUP' ? 0 : (shippingQuote.data?.shippingCost ?? null);
  const freeShipping = coupon?.freeShipping ?? shippingQuote.data?.freeApplied ?? false;

  const placing = createOrder.isPending || initiate.isPending;
  const isAdmin = canAccessAdmin(user ?? null);

  const onPlace = (values: CheckoutFormInput) => {
    setError(null);
    if (values.fulfillmentMethod === 'DELIVERY' && !address) {
      setError('Select a delivery address.');
      return;
    }
    if (values.fulfillmentMethod === 'PICKUP' && !pickupId) {
      setError('Select a pickup location.');
      return;
    }

    // Billing = shipping when "same as shipping" (delivery only); otherwise the chosen billing address.
    const billing =
      values.fulfillmentMethod === 'DELIVERY' && billingSameAsShipping ? address : billingAddress;
    if (!billing) {
      setError('Select a billing address.');
      return;
    }

    const body = {
      fulfillmentMethod: values.fulfillmentMethod,
      paymentMethod: values.paymentMethod,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      customerNote: values.customerNote || undefined,
      couponCode: coupon?.code,
      billingAddress: toAddressInput(billing),
      ...(values.fulfillmentMethod === 'DELIVERY'
        ? { shippingAddress: address ? toAddressInput(address) : undefined }
        : { pickupLocationId: pickupId ?? undefined }),
    };

    const payKey = crypto.randomUUID();
    createOrder.mutate(
      { body, idempotencyKey: idempotencyKey.current },
      {
        onSuccess: (order) => {
          initiate.mutate(
            { orderId: order.id, method: values.paymentMethod, idempotencyKey: payKey },
            {
              onSuccess: (res) => {
                if (res.redirect) {
                  gatewayRedirect(res.redirect);
                } else {
                  router.push(`/checkout/result?order=${order.orderNumber}&status=success`);
                }
              },
              onError: (err) =>
                setError(
                  err instanceof ApiError ? err.messages[0] : 'Payment could not be started',
                ),
            },
          );
        },
        onError: (err) =>
          setError(err instanceof ApiError ? err.messages[0] : 'Could not place order'),
      },
    );
  };

  return {
    form,
    isAdmin,
    method,
    payMethod,
    address,
    setAddress,
    billingAddress,
    setBillingAddress,
    billingSameAsShipping,
    setBillingSameAsShipping,
    pickupId,
    setPickupId,
    coupon,
    setCoupon,
    error,
    subtotal,
    lines,
    shippingCost,
    freeShipping,
    placing,
    onPlace,
  };
}
