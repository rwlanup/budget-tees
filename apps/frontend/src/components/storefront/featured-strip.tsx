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
    <StorefrontContainer className="py-10">
      <SectionHeading title="Featured" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border">
                <Skeleton className="aspect-square w-full" />
                <div className="space-y-2 p-3">
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
