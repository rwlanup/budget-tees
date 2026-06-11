'use client';

import { StarRating } from './star-rating';
import type { ReviewSummary } from '@/modules/review/types';

/** Average + count + per-star distribution bars. */
export function ReviewSummaryPanel({ summary }: { summary: ReviewSummary }) {
  const { average, count, distribution } = summary;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="flex flex-col items-center justify-center sm:w-40">
        <span className="font-heading text-4xl font-bold tabular-nums">{average.toFixed(1)}</span>
        <StarRating value={average} size="md" className="mt-1" />
        <span className="mt-1 text-sm text-muted-foreground">
          {count} review{count === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = distribution[String(star) as '1' | '2' | '3' | '4' | '5'] ?? 0;
          const pct = count ? Math.round((n / count) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-3 tabular-nums text-muted-foreground">{star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-warning" style={{ width: `${pct}%` }} aria-hidden />
              </div>
              <span className="w-8 text-right tabular-nums text-muted-foreground">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
