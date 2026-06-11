'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReviewCard } from './review-card';
import { useProductReviews } from '@/modules/review/queries';

export function ReviewList({ productId }: { productId: string }) {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isFetching } = useProductReviews(productId, page);

  if (isLoading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 border-b py-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-full max-w-prose" />
          </div>
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <p className="py-6 text-sm text-muted-foreground">No reviews yet. Be the first to review.</p>
    );
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <div className="divide-y">
        {items.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
