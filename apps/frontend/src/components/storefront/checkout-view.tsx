'use client';

import * as React from 'react';
import Link from 'next/link';
import { Truck, Store, Loader2, ShieldAlert, Lock, ChevronDown } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { AddressSelect } from './address-select';
import { PickupSelect } from './pickup-select';
import { CouponField } from './coupon-field';
import { CheckoutSummary } from './checkout-summary';
import { EmptyState } from '@/components/shared/empty-state';
import { useCheckout } from '@/modules/checkout/use-checkout';
import type { PricedCartLine } from '@/modules/cart/types';
import type { PaymentMethod } from '@/modules/order/types';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: 'COD', label: 'Cash on delivery', hint: 'Pay when you receive' },
  { value: 'ESEWA', label: 'eSewa', hint: 'Pay online' },
];

export function CheckoutView() {
  const checkout = useCheckout();
  const {
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
  } = checkout;

  // Storefront-only flow: staff/admin accounts can browse but not check out.
  if (isAdmin) {
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
      <form onSubmit={form.handleSubmit(onPlace)} className="space-y-8" noValidate>
        <CheckoutSteps />

        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            {/* Fulfillment */}
            <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
              <SectionHeading step={1} title="Delivery method" />
              <div className="mt-4 grid grid-cols-2 gap-3">
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
                      aria-pressed={active}
                      className={cn(
                        'press flex items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors',
                        active
                          ? 'border-brand bg-brand-muted/40 text-brand-strong ring-2 ring-brand/30'
                          : 'border-border hover:border-foreground/20 hover:bg-accent',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4">
                {method === 'DELIVERY' ? (
                  <AddressSelect
                    selectedId={address?.id ?? null}
                    onSelect={setAddress}
                    preferType="SHIPPING"
                  />
                ) : (
                  <PickupSelect selectedId={pickupId} onSelect={setPickupId} />
                )}
              </div>
            </section>

            {/* Billing address */}
            <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
              <SectionHeading step={2} title="Billing address" />
              <div className="mt-4 space-y-3">
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
              </div>
            </section>

            {/* Contact */}
            <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
              <SectionHeading step={3} title="Contact" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                        <PhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          name={field.name}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
              <SectionHeading step={4} title="Payment" />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map((pm) => {
                  const active = payMethod === pm.value;
                  return (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => form.setValue('paymentMethod', pm.value)}
                      aria-pressed={active}
                      className={cn(
                        'press rounded-xl border p-4 text-left transition-colors',
                        active
                          ? 'border-brand bg-brand-muted/40 ring-2 ring-brand/30'
                          : 'border-border hover:border-foreground/20 hover:bg-accent',
                      )}
                    >
                      <p className="text-sm font-semibold">{pm.label}</p>
                      <p className="text-xs text-muted-foreground">{pm.hint}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Coupon + note */}
            <section className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
              <SectionHeading step={5} title="Coupon & note" />
              <div className="mt-4 space-y-4">
                <CouponField applied={coupon} onApply={setCoupon} onClear={() => setCoupon(null)} />
                <div className="space-y-2">
                  <Label htmlFor="note">Order note (optional)</Label>
                  <Textarea id="note" rows={2} {...form.register('customerNote')} />
                </div>
              </div>
            </section>
          </div>

          <OrderSummaryAside
            lines={lines}
            subtotal={subtotal}
            shippingCost={shippingCost}
            discount={coupon?.discountAmount ?? 0}
            freeShipping={freeShipping}
            payMethod={payMethod}
            placing={placing}
            error={error}
          />
        </div>
      </form>
    </Form>
  );
}

/** Order summary aside — sticky on desktop, collapsible on mobile, with the place-order CTA. */
function OrderSummaryAside({
  lines,
  subtotal,
  shippingCost,
  discount,
  freeShipping,
  payMethod,
  placing,
  error,
}: {
  lines: PricedCartLine[];
  subtotal: number;
  shippingCost: number | null;
  discount: number;
  freeShipping: boolean;
  payMethod: PaymentMethod;
  placing: boolean;
  error: string | null;
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
      <details className="group rounded-2xl border bg-card shadow-sm lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-baseline gap-2">
            <span className="font-heading font-semibold">Order summary</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {lines.length} item{lines.length === 1 ? '' : 's'}
            </span>
          </span>
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div className="px-4 pb-4">
          <CheckoutSummary
            lines={lines}
            subtotal={subtotal}
            shippingCost={shippingCost}
            discount={discount}
            freeShipping={freeShipping}
            bare
          />
        </div>
      </details>

      <div className="hidden lg:block">
        <CheckoutSummary
          lines={lines}
          subtotal={subtotal}
          shippingCost={shippingCost}
          discount={discount}
          freeShipping={freeShipping}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={placing || lines.length === 0}>
        {placing ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Lock className="size-4" aria-hidden />
        )}
        Place order
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="size-3" aria-hidden />
        You’ll {payMethod === 'COD' ? 'confirm your order' : 'be redirected to pay securely'}.
      </p>
    </aside>
  );
}

function CheckoutSteps() {
  return (
    <ol className="no-scrollbar flex items-center gap-2 overflow-x-auto text-xs font-medium">
      {['Details', 'Payment', 'Review'].map((label, i) => (
        <li key={label} className="flex items-center gap-2 whitespace-nowrap">
          <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
            {i + 1}
          </span>
          <span className="text-foreground">{label}</span>
          {i < 2 && <span className="h-px w-6 bg-border" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-semibold text-brand-strong">
        {step}
      </span>
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
    </div>
  );
}
