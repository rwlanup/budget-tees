'use client';

import Link from 'next/link';
import { PriceTag } from './price-tag';
import { ProductImage } from './product-image';
import { useProductPrimaryImage } from '@/modules/catalog/queries';
import type { FeaturedItem } from '@/modules/catalog/api';

/** Product-level card (featured has no SKU id) — links to PDP to choose a variant. */
export function FeaturedCard({ item }: { item: FeaturedItem }) {
  const { data: image } = useProductPrimaryImage(item.productId);
  const href = `/product/${item.slug}`;

  return (
    <div className="press group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-foreground/15 hover:shadow-lg">
      <Link href={href} aria-label={item.name} className="overflow-hidden">
        <ProductImage
          src={image ?? null}
          alt={item.name}
          className="rounded-none [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <Link
          href={href}
          className="line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-brand"
        >
          {item.name}
        </Link>
        <PriceTag
          price={item.basePrice}
          salePrice={item.salePrice}
          onSale={item.onSale}
          size="sm"
          showBadge={false}
        />
      </div>
    </div>
  );
}
