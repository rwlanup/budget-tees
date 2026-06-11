'use client';

import { StarRating } from './star-rating';
import { formatDate } from '@/lib/utils';
import type { PublicReview } from '@/modules/review/types';

export function ReviewCard({ review }: { review: PublicReview }) {
  return (
    <article className="border-b py-5 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} size="sm" />
          <span className="text-sm font-medium">{review.authorName}</span>
        </div>
        <time className="text-xs text-muted-foreground" dateTime={review.createdAt}>
          {formatDate(review.createdAt)}
        </time>
      </div>
      {review.title && <h4 className="mt-2 text-sm font-semibold">{review.title}</h4>}
      {review.body && (
        <p className="mt-1 max-w-prose whitespace-pre-line text-sm text-muted-foreground">
          {review.body}
        </p>
      )}
    </article>
  );
}
