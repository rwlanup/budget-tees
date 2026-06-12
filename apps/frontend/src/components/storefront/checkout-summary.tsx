'use client';

import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import type { PricedCartLine } from '@/modules/cart/types';

export function CheckoutSummary({
  lines,
  subtotal,
  shippingCost,
  discount,
  freeShipping,
  bare = false,
}: {
  lines: PricedCartLine[];
  subtotal: number;
  shippingCost: number | null;
  discount: number;
  freeShipping: boolean;
  /** Drop the card chrome + "Order summary" title (for embedding under an existing header). */
  bare?: boolean;
}) {
  const { currency } = useStoreConfig();
  const ship = freeShipping ? 0 : (shippingCost ?? 0);
  const estimated = Math.max(0, subtotal - discount) + ship;

  return (
    <div className={cn(!bare && 'rounded-2xl border bg-card p-5 shadow-sm sm:p-6')}>
      {!bare && <h2 className="font-heading text-lg font-semibold">Order summary</h2>}
      <ul className={cn('space-y-3', !bare && 'mt-4')}>
        {lines.map((l) => (
          <li key={l.itemId} className="flex justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="line-clamp-1">{l.productName}</span>
              <span className="shrink-0 text-muted-foreground tabular-nums">× {l.quantity}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatCurrency(l.lineTotal, currency)}
            </span>
          </li>
        ))}
      </ul>
      <Separator className="my-4" />
      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatCurrency(subtotal, currency)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between font-medium text-success">
            <dt>Discount</dt>
            <dd className="tabular-nums">−{formatCurrency(discount, currency)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="tabular-nums">
            {freeShipping ? (
              <span className="font-medium text-success">Free</span>
            ) : shippingCost == null ? (
              <span className="text-muted-foreground">Calculated next</span>
            ) : (
              formatCurrency(shippingCost, currency)
            )}
          </dd>
        </div>
      </dl>
      <Separator className="my-4" />
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">Estimated total</span>
        <span className="font-heading text-xl font-bold tabular-nums">
          {formatCurrency(estimated, currency)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Taxes are included. Final total (incl. shipping &amp; tax) is confirmed when you place the
        order.
      </p>
    </div>
  );
}
