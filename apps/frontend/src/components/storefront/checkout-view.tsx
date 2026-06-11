'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck, Store, Loader2, ShieldAlert } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api/client';
import { AddressSelect } from './address-select';
import { PickupSelect } from './pickup-select';
import { CouponField } from './coupon-field';
import { CheckoutSummary } from './checkout-summary';
import { EmptyState } from '@/components/shared/empty-state';
import { canAccessAdmin } from '@/lib/auth/auth-store';
import { useMe } from '@/modules/auth/queries';
import { useCart } from '@/modules/cart/queries';
import { useCreateOrder, useInitiatePayment, useShippingQuote } from '@/modules/checkout/queries';
import { gatewayRedirect } from '@/modules/checkout/gateway';
import { checkoutSchema, type CheckoutFormInput } from '@/modules/checkout/schemas';
import type { AddressInput, CouponPreview } from '@/modules/checkout/types';
import type { UserAddress } from '@/modules/account/types';
import type { PaymentMethod } from '@/modules/order/types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: 'COD', label: 'Cash on delivery', hint: 'Pay when you receive' },
  { value: 'ESEWA', label: 'eSewa', hint: 'Pay online' },
];

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

export function CheckoutView() {
  const router = useRouter();
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

  // Storefront-only flow: staff/admin accounts can browse but not check out.
  if (canAccessAdmin(user ?? null)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Admin accounts can’t place orders"
        description="Checkout is for customer accounts only. Sign in with a customer account to place an order."
        action={
          <Button asChild variant="outline">
            <Link href="/shop">Back to shop</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onPlace)}
        className="grid gap-8 lg:grid-cols-[1fr_22rem]"
        noValidate
      >
        <div className="space-y-8">
          {/* Fulfillment */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Delivery method</h2>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'DELIVERY', label: 'Delivery', icon: Truck },
                  { value: 'PICKUP', label: 'Store pickup', icon: Store },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = method === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue('fulfillmentMethod', opt.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 text-sm font-medium',
                      active ? 'border-primary ring-1 ring-primary' : 'hover:bg-accent',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {method === 'DELIVERY' ? (
              <AddressSelect
                selectedId={address?.id ?? null}
                onSelect={setAddress}
                preferType="SHIPPING"
              />
            ) : (
              <PickupSelect selectedId={pickupId} onSelect={setPickupId} />
            )}
          </section>

          {/* Billing address */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Billing address</h2>
            {method === 'DELIVERY' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="billing-same"
                  checked={billingSameAsShipping}
                  onCheckedChange={(v) => setBillingSameAsShipping(v === true)}
                />
                <Label htmlFor="billing-same" className="font-normal">
                  Same as shipping address
                </Label>
              </div>
            )}
            {!(method === 'DELIVERY' && billingSameAsShipping) && (
              <AddressSelect
                selectedId={billingAddress?.id ?? null}
                onSelect={setBillingAddress}
                preferType="BILLING"
              />
            )}
          </section>

          {/* Contact */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Payment */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Payment</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {PAYMENT_METHODS.map((pm) => {
                const active = payMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => form.setValue('paymentMethod', pm.value)}
                    className={cn(
                      'rounded-lg border p-3 text-left',
                      active ? 'border-primary ring-1 ring-primary' : 'hover:bg-accent',
                    )}
                  >
                    <p className="text-sm font-medium">{pm.label}</p>
                    <p className="text-xs text-muted-foreground">{pm.hint}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Coupon + note */}
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Coupon</h2>
            <CouponField applied={coupon} onApply={setCoupon} onClear={() => setCoupon(null)} />
            <div className="space-y-2">
              <Label htmlFor="note">Order note (optional)</Label>
              <Textarea id="note" rows={2} {...form.register('customerNote')} />
            </div>
          </section>
        </div>

        {/* Summary aside */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <CheckoutSummary
            lines={lines}
            subtotal={subtotal}
            shippingCost={shippingCost}
            discount={coupon?.discountAmount ?? 0}
            freeShipping={freeShipping}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={placing || lines.length === 0}
          >
            {placing && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Place order
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You’ll {payMethod === 'COD' ? 'confirm your order' : 'be redirected to pay securely'}.
          </p>
        </aside>
      </form>
    </Form>
  );
}
