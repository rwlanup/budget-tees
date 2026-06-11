'use client';

import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import type { PricedCartLine } from '@/modules/cart/types';

export function CheckoutSummary({
  lines,
  subtotal,
  shippingCost,
  discount,
  freeShipping,
}: {
  lines: PricedCartLine[];
  subtotal: number;
  shippingCost: number | null;
  discount: number;
  freeShipping: boolean;
}) {
  const { currency } = useStoreConfig();
  const ship = freeShipping ? 0 : (shippingCost ?? 0);
  const estimated = Math.max(0, subtotal - discount) + ship;

  return (
    <div className="rounded-lg border p-5">
      <h2 className="font-heading text-lg font-semibold">Order summary</h2>
      <ul className="mt-4 space-y-3">
        {lines.map((l) => (
          <li key={l.itemId} className="flex justify-between gap-2 text-sm">
            <span className="min-w-0">
              <span className="line-clamp-1">{l.productName}</span>
              <span className="text-muted-foreground">× {l.quantity}</span>
            </span>
            <span className="tabular-nums">{formatCurrency(l.lineTotal, currency)}</span>
          </li>
        ))}
      </ul>
      <Separator className="my-4" />
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatCurrency(subtotal, currency)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <dt>Discount</dt>
            <dd className="tabular-nums">−{formatCurrency(discount, currency)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="tabular-nums">
            {freeShipping
              ? 'Free'
              : shippingCost == null
                ? 'Calculated next'
                : formatCurrency(shippingCost, currency)}
          </dd>
        </div>
      </dl>
      <Separator className="my-4" />
      <div className="flex items-center justify-between">
        <span className="font-medium">Estimated total</span>
        <span className="text-lg font-semibold tabular-nums">
          {formatCurrency(estimated, currency)}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Taxes are included. Final total (incl. shipping &amp; tax) is confirmed when you place the
        order.
      </p>
    </div>
  );
}
