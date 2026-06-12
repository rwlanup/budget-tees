'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartUiStore } from '@/lib/storefront/cart-ui-store';

/**
 * Header cart trigger. Opens the global drawer. Count badge is wired in P2 when
 * the cart query exists; hidden while the count is 0.
 */
export function CartButton({ count = 0 }: { count?: number }) {
  const openCart = useCartUiStore((s) => s.openCart);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={count > 0 ? `Cart, ${count} items` : 'Cart'}
      onClick={openCart}
    >
      <ShoppingCart className="size-5" aria-hidden />
      {count > 0 && (
        <span className="reveal-scale absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-brand-foreground tabular-nums ring-2 ring-background">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
}
