import { Skeleton } from '@/components/ui/skeleton';
import { Stagger, StaggerItem } from '@/components/motion/reveal';
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
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-3.5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {variants.map((v) => (
        <StaggerItem key={v.skuId}>
          <VariantCard variant={v} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
