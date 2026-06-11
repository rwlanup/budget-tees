import { Skeleton } from '@/components/ui/skeleton';
import { VariantCard } from './variant-card';
import type { StorefrontVariant } from '@/modules/catalog/types';

export function VariantGrid({
  variants,
  isLoading,
  skeletonCount = 12,
}: {
  variants: StorefrontVariant[];
  isLoading?: boolean;
  skeletonCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))
        : variants.map((v) => <VariantCard key={v.skuId} variant={v} />)}
    </div>
  );
}
