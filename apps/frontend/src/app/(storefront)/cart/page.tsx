'use client';

import Link from 'next/link';
import { ShoppingCart, Trash2, Loader2, TriangleAlert } from 'lucide-react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { QuantityStepper } from '@/components/storefront/quantity-stepper';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { cn, formatCurrency } from '@/lib/utils';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import { canAccessAdmin } from '@/lib/auth/auth-store';
import { useMe } from '@/modules/auth/queries';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/modules/cart/queries';

export default function CartPage() {
  const { currency } = useStoreConfig();
  const { data: cart, isLoading } = useCart();
  const { data: user } = useMe();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  const items = cart?.items ?? [];
  const isStaff = canAccessAdmin(user ?? null);

  return (
    <StorefrontContainer className="py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Your cart</h1>

      {isLoading ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the shop and add items to your cart."
          action={
            <Button asChild>
              <Link href="/shop">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <ul className="divide-y rounded-lg border">
            {items.map((line) => (
              <li key={line.itemId} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${line.productId}`}
                    className={cn(
                      'font-medium hover:underline',
                      line.unavailable && 'text-muted-foreground',
                    )}
                  >
                    {line.productName}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="tabular-nums">{formatCurrency(line.unitPrice, currency)}</span>
                    {line.onSale && (
                      <Badge className="bg-success text-success-foreground hover:bg-success">
                        Sale
                      </Badge>
                    )}
                  </div>
                  {line.unavailable ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <TriangleAlert className="size-3" aria-hidden />
                      No longer available — remove to checkout
                    </p>
                  ) : !line.inStock ? (
                    <p className="mt-1 text-xs text-warning-foreground">
                      Only {line.available} left — reduce quantity
                    </p>
                  ) : null}
                </div>

                {!line.unavailable && (
                  <QuantityStepper
                    value={line.quantity}
                    max={line.available || 99}
                    disabled={update.isPending}
                    onChange={(q) => update.mutate({ itemId: line.itemId, quantity: q })}
                  />
                )}

                <div className="w-24 text-right font-medium tabular-nums">
                  {line.unavailable ? '—' : formatCurrency(line.lineTotal, currency)}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${line.productName}`}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(line.itemId)}
                >
                  {remove.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-4" aria-hidden />
                  )}
                </Button>
              </li>
            ))}
          </ul>

          <Card className="h-fit p-5 lg:sticky lg:top-24">
            <h2 className="font-heading text-lg font-semibold">Summary</h2>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(cart?.subtotal ?? 0, currency)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Taxes, shipping and coupons are applied at checkout.
            </p>
            <Separator className="my-4" />
            {isStaff ? (
              <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
                Admin accounts can’t place orders. Sign in with a customer account to check out.
              </p>
            ) : (
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
            )}
            <Button asChild variant="ghost" className="mt-2 w-full">
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </Card>
        </div>
      )}
    </StorefrontContainer>
  );
}
