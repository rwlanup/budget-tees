'use client';

import Link from 'next/link';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PriceTag } from './price-tag';
import { ProductImage } from './product-image';
import { useProductPrimaryImage } from '@/modules/catalog/queries';
import { useMoveToCart, useRemoveWishlist } from '@/modules/wishlist/queries';
import { useCartUiStore } from '@/lib/storefront/cart-ui-store';
import { ApiError } from '@/lib/api/client';
import type { WishlistItem } from '@/modules/wishlist/types';

export function WishlistCard({ item }: { item: WishlistItem }) {
  const { data: image } = useProductPrimaryImage(item.productId);
  const move = useMoveToCart();
  const remove = useRemoveWishlist();
  const openCart = useCartUiStore((s) => s.openCart);

  const href = `/product/${item.slug}?sku=${item.skuId}`;

  const handleMove = () => {
    move.mutate(
      { skuId: item.skuId, body: { quantity: 1, removeFromWishlist: false } },
      {
        onSuccess: () => {
          toast.success('Added to cart');
          openCart();
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Could not add to cart'),
      },
    );
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <Link href={href} aria-label={item.name}>
        <ProductImage src={image ?? null} alt={item.name} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={href} className="line-clamp-2 text-sm font-medium hover:underline">
          {item.name}
        </Link>
        <PriceTag
          price={item.basePrice}
          salePrice={item.salePrice}
          onSale={item.onSale}
          size="sm"
          showBadge={false}
        />
        <div className="mt-auto flex items-center gap-2 pt-1">
          {item.inStock ? (
            <Button size="sm" className="flex-1" onClick={handleMove} disabled={move.isPending}>
              {move.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Add to cart
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={href}>Sold out</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${item.name} from wishlist`}
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.skuId)}
          >
            {remove.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
