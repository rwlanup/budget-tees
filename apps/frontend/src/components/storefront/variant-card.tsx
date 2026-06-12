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
    <div className="h-full press group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg">
      <Link href={href} className="relative block overflow-hidden" aria-label={variant.productName}>
        <ProductImage
          src={imageUrl(variant.image)}
          alt={variant.productName}
          className="rounded-none [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {!variant.inStock && (
            <Badge variant="secondary" className="shadow-sm backdrop-blur">
              Sold out
            </Badge>
          )}
          {variant.onSale && variant.discountPct > 0 && (
            <Badge variant="success" className="shadow-sm">
              −{variant.discountPct}%
            </Badge>
          )}
        </div>
      </Link>
      <div className="absolute right-2.5 top-2.5 z-10">
        <WishlistButton
          skuId={variant.skuId}
          mode="card"
          className="size-9 bg-card/80 shadow-sm backdrop-blur hover:bg-card"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="min-w-0">
          {variant.brand && (
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {variant.brand.name}
            </p>
          )}
          <Link
            href={href}
            className="line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-brand"
          >
            {variant.name}
          </Link>
          {attrs && <p className="mt-0.5 truncate text-xs text-muted-foreground">{attrs}</p>}
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

        <div className="mt-auto pt-1">
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
