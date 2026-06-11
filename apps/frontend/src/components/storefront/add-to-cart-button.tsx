'use client';

import { Loader2, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { useCartUiStore } from '@/lib/storefront/cart-ui-store';
import { useAddToCart } from '@/modules/cart/queries';

interface Props {
  skuId: string;
  inStock: boolean;
  quantity?: number;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  /** Open the cart drawer after adding (PDP yes; listing optional). */
  openDrawer?: boolean;
  label?: string;
}

export function AddToCartButton({
  skuId,
  inStock,
  quantity = 1,
  size = 'default',
  className,
  openDrawer = true,
  label = 'Add to cart',
}: Props) {
  const add = useAddToCart();
  const openCart = useCartUiStore((s) => s.openCart);

  const handleAdd = () => {
    add.mutate(
      { skuId, quantity },
      {
        onSuccess: () => {
          toast.success('Added to cart');
          if (openDrawer) openCart();
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Could not add to cart'),
      },
    );
  };

  if (!inStock) {
    return (
      <Button size={size} variant="secondary" className={className} disabled>
        Sold out
      </Button>
    );
  }

  return (
    <Button size={size} className={className} onClick={handleAdd} disabled={add.isPending}>
      {add.isPending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : add.isSuccess ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <ShoppingCart className="size-4" aria-hidden />
      )}
      {label}
    </Button>
  );
}
