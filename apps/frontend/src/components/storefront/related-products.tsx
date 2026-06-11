'use client';

import { VariantCard } from './variant-card';
import { useVariants } from '@/modules/catalog/queries';

/** Variants from the same category, excluding the current product. */
export function RelatedProducts({
  categoryId,
  excludeProductId,
}: {
  categoryId: string;
  excludeProductId: string;
}) {
  const { data } = useVariants({ categoryId, limit: 12, sort: 'newest' });
  const items = (data?.items ?? []).filter((v) => v.productId !== excludeProductId).slice(0, 4);

  if (!items.length) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 font-heading text-xl font-semibold">You may also like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((v) => (
          <VariantCard key={v.skuId} variant={v} />
        ))}
      </div>
    </section>
  );
}
