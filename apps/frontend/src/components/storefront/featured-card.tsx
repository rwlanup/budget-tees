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
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-sm">
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
      </div>
    </div>
  );
}
