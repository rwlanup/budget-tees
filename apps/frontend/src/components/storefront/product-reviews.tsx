'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Lock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StarRating } from './star-rating';
import { ReviewSummaryPanel } from './review-summary';
import { ReviewForm } from './review-form';
import { ReviewList } from './review-list';
import { formatDate } from '@/lib/utils';
import { useDeleteReview, useMyReview, useReviewSummary } from '@/modules/review/queries';
import { useIsAuthed } from '@/modules/wishlist/queries';

/** PDP reviews section: summary + write/edit gating + list. */
export function ProductReviews({ productId }: { productId: string }) {
  const authed = useIsAuthed();
  const { data: summary, isLoading: summaryLoading } = useReviewSummary(productId);
  const hasReviews = (summary?.count ?? 0) > 0;

  return (
    <section className="space-y-6">
      {summaryLoading ? (
        <Skeleton className="h-28 w-full max-w-2xl" />
      ) : hasReviews && summary ? (
        <ReviewSummaryPanel summary={summary} />
      ) : null}

      <WriteArea productId={productId} authed={authed} />

      <Separator />

      <ReviewList productId={productId} />
    </section>
  );
}

function WriteArea({ productId, authed }: { productId: string; authed: boolean }) {
  const { data, isLoading } = useMyReview(productId);
  const del = useDeleteReview(productId);
  const [editing, setEditing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!authed) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm">
        <Link href="/sign-in" className="font-medium underline underline-offset-4">
          Sign in
        </Link>{' '}
        to write a review. Only verified buyers can review.
      </div>
    );
  }

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!data) return null;

  const { review, eligibility } = data;

  // Has a review → show it with edit/delete.
  if (review) {
    if (editing) {
      return (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 font-heading text-lg font-semibold">Edit your review</h3>
          <ReviewForm
            productId={productId}
            existing={review}
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      );
    }
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Your review</p>
            <StarRating value={review.rating} size="sm" className="mt-1" />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" aria-hidden /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          </div>
        </div>
        {review.title && <h4 className="mt-2 text-sm font-semibold">{review.title}</h4>}
        {review.body && (
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{review.body}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Reviewed {formatDate(review.updatedAt)}
        </p>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Delete your review?"
          description="This permanently removes your review of this product."
          confirmLabel="Delete"
          destructive
          loading={del.isPending}
          onConfirm={() =>
            del.mutate(review.id, {
              onSuccess: () => {
                toast.success('Review deleted');
                setConfirmDelete(false);
              },
              onError: () => toast.error('Could not delete review'),
            })
          }
        />
      </div>
    );
  }

  // Eligible buyer, no review yet → form.
  if (eligibility.canReview) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-heading text-lg font-semibold">Write a review</h3>
        <ReviewForm productId={productId} />
      </div>
    );
  }

  // Logged in but never received this product.
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
      <Lock className="size-4 shrink-0" aria-hidden />
      Only verified buyers can review this product.
    </div>
  );
}
