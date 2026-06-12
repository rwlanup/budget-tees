'use client';

import Link from 'next/link';
import { ShoppingCart, Trash2, Loader2, TriangleAlert, Tag } from 'lucide-react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { ProductImage } from '@/components/storefront/product-image';
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
      <header className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Your cart</h1>
        {!isLoading && items.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{items.length}</span>{' '}
            {items.length === 1 ? 'item' : 'items'} ready to check out
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="shimmer h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="shimmer h-56 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          className="bg-aurora py-16"
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the shop and add items to your cart."
          action={
            <Button asChild variant="brand" size="lg">
              <Link href="/shop">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <ul className="space-y-3">
            {items.map((line) => (
              <li
                key={line.itemId}
                className={cn(
                  'flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-5',
                  line.unavailable && 'opacity-70',
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Link
                    href={`/product/${line.productId}`}
                    className="shrink-0"
                    aria-label={line.productName}
                  >
                    <ProductImage
                      src={line.imageUrl}
                      alt={line.productName}
                      className="size-20 rounded-lg"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.productId}`}
                      className={cn(
                        'font-medium transition-colors hover:text-brand',
                        line.unavailable && 'text-muted-foreground',
                      )}
                    >
                      {line.productName}
                    </Link>
                  <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="tabular-nums">{formatCurrency(line.unitPrice, currency)}</span>
                    {line.onSale && (
                      <Badge variant="success">
                        <Tag className="size-3" aria-hidden />
                        Sale
                      </Badge>
                    )}
                  </div>
                  {line.unavailable ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <TriangleAlert className="size-3.5" aria-hidden />
                      No longer available — remove to checkout
                    </p>
                  ) : !line.inStock ? (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning-foreground">
                      <TriangleAlert className="size-3.5 text-warning" aria-hidden />
                      Only {line.available} left — reduce quantity
                    </p>
                  ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-border pt-4 sm:gap-5 sm:border-0 sm:pt-0">
                  {!line.unavailable && (
                    <QuantityStepper
                      value={line.quantity}
                      max={line.available || 99}
                      disabled={update.isPending}
                      onChange={(q) => update.mutate({ itemId: line.itemId, quantity: q })}
                    />
                  )}

                  <div className="ml-auto text-right font-semibold tabular-nums sm:w-24">
                    {line.unavailable ? '—' : formatCurrency(line.lineTotal, currency)}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${line.productName}`}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(line.itemId)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    {remove.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-4" aria-hidden />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <Card className="h-fit rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-heading text-lg font-semibold">Summary</h2>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold tabular-nums">
                {formatCurrency(cart?.subtotal ?? 0, currency)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Taxes, shipping and coupons are applied at checkout.
            </p>
            <Separator className="my-5" />
            {isStaff ? (
              <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
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
