'use client';

import Link from 'next/link';
import { ShoppingCart, Trash2, Loader2, TriangleAlert } from 'lucide-react';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { useCartUiStore } from '@/lib/storefront/cart-ui-store';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import { canAccessAdmin } from '@/lib/auth/auth-store';
import { useMe } from '@/modules/auth/queries';
import { useCart, useRemoveCartItem } from '@/modules/cart/queries';

/**
 * Global cart drawer. Live line items + subtotal + checkout CTA. Quantity editing,
 * coupons and the full /cart page land in P2.
 */
export function CartDrawer() {
  const open = useCartUiStore((s) => s.open);
  const setOpen = useCartUiStore((s) => s.setOpen);
  const { currency } = useStoreConfig();
  const { data: cart, isLoading } = useCart();
  const { data: user } = useMe();
  const removeItem = useRemoveCartItem();

  const items = cart?.items ?? [];
  const isStaff = canAccessAdmin(user ?? null);
  const isEmpty = !isLoading && items.length === 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Your cart {cart?.itemCount ? `(${cart.itemCount})` : ''}</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 space-y-4 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="size-6 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add items to get started.</p>
            </div>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex-1 divide-y overflow-y-auto px-6">
            {items.map((line) => (
              <li key={line.itemId} className="flex items-start gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{line.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {line.quantity} · {formatCurrency(line.unitPrice, currency)}
                  </p>
                  {line.unavailable ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <TriangleAlert className="size-3" aria-hidden />
                      No longer available
                    </p>
                  ) : !line.inStock ? (
                    <p className="mt-1 text-xs text-warning-foreground">Limited stock</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={cn(
                      'text-sm font-medium tabular-nums',
                      line.unavailable && 'text-muted-foreground line-through',
                    )}
                  >
                    {formatCurrency(line.lineTotal, currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Remove ${line.productName}`}
                    disabled={removeItem.isPending}
                    onClick={() => removeItem.mutate(line.itemId)}
                  >
                    {removeItem.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-4" aria-hidden />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isEmpty && !isLoading && (
          <SheetFooter className="border-t">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-base font-semibold tabular-nums">
                {formatCurrency(cart?.subtotal ?? 0, currency)}
              </span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Taxes, shipping and coupons are applied at checkout.
            </p>
            <Separator className="mb-3" />
            {isStaff ? (
              <p className="rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
                Admin accounts can’t place orders.
              </p>
            ) : (
              <Button asChild className="w-full" onClick={() => setOpen(false)}>
                <Link href="/checkout">Checkout</Link>
              </Button>
            )}
            <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
              <Link href="/cart">View cart</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
