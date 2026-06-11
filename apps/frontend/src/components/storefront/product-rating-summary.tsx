'use client';

import { StarRating } from './star-rating';
import { useReviewSummary } from '@/modules/review/queries';

/** Compact rating line under the PDP title. Hidden until there's ≥1 review. */
export function ProductRatingSummary({ productId }: { productId: string }) {
  const { data } = useReviewSummary(productId);
  if (!data || data.count === 0) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <StarRating value={data.average} size="sm" />
      <span className="text-sm text-muted-foreground">
        {data.average.toFixed(1)} ({data.count})
      </span>
    </div>
  );
}
