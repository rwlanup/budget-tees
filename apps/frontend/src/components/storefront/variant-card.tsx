'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PriceTag } from './price-tag';
import { ProductImage } from './product-image';
import { AddToCartButton } from './add-to-cart-button';
import { WishlistButton } from './wishlist-button';
import { imageUrl, type StorefrontVariant } from '@/modules/catalog/types';

export function VariantCard({ variant }: { variant: StorefrontVariant }) {
  const href = `/product/${variant.productSlug}?sku=${variant.skuId}`;
  const attrs = variant.attributes.map((a) => a.value).join(' · ');

  return (
    <div className="relative flex flex-col overflow-hidden transition-shadow border rounded-lg group bg-card hover:shadow-sm">
      <Link href={href} className="relative block" aria-label={variant.productName}>
        <ProductImage src={imageUrl(variant.image)} alt={variant.productName} />
        <div className="absolute flex flex-col items-start gap-1 left-2 top-2">
          {!variant.inStock && <Badge variant="secondary">Sold out</Badge>}
          {variant.onSale && variant.discountPct > 0 && (
            <Badge className="bg-success text-success-foreground hover:bg-success">
              −{variant.discountPct}%
            </Badge>
          )}
        </div>
      </Link>
      <div className="absolute z-10 right-2 top-2">
        <WishlistButton skuId={variant.skuId} mode="card" />
      </div>

      <div className="flex flex-col flex-1 gap-2 p-3">
        <div className="min-w-0">
          <Link href={href} className="text-sm font-medium line-clamp-2 hover:underline">
            {variant.name}
          </Link>
          {attrs && <p className="mt-0.5 truncate text-xs text-muted-foreground">{attrs}</p>}
          {variant.brand && (
            <p className="text-xs truncate text-muted-foreground">{variant.brand.name}</p>
          )}
        </div>

        <PriceTag
          price={variant.price}
          salePrice={variant.salePrice}
          compareAtPrice={variant.compareAtPrice}
          onSale={variant.onSale}
          discountPct={variant.discountPct}
          size="sm"
          showBadge={false}
        />

        <div className="pt-1 mt-auto">
          <AddToCartButton
            skuId={variant.skuId}
            inStock={variant.inStock}
            size="sm"
            className="w-full"
            openDrawer={false}
            label="Add"
          />
        </div>
      </div>
    </div>
  );
}
