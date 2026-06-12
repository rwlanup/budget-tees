'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeading } from './section-heading';
import { StorefrontContainer } from './storefront-container';
import { FeaturedCard } from './featured-card';
import { useFeatured } from '@/modules/catalog/queries';

export function FeaturedStrip() {
  const { data, isLoading } = useFeatured();
  const items = (data ?? []).slice(0, 8);

  if (!isLoading && items.length === 0) return null;

  return (
    <StorefrontContainer className="py-14 sm:py-20">
      <SectionHeading eyebrow="Hand-picked" title="Featured" href="/shop" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="space-y-2 p-3.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          : items.map((it) => <FeaturedCard key={it.productId} item={it} />)}
      </div>
    </StorefrontContainer>
  );
}
