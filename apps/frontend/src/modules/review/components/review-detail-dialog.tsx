'use client';

import Link from 'next/link';
import { ArrowUpRight, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StarRating } from '@/components/storefront/star-rating';
import { formatDate } from '@/lib/utils';
import type { AdminReview } from '../types';
import { ReviewStatusBadge } from './review-status-badge';

export function ReviewDetailDialog({
  review,
  onOpenChange,
}: {
  review: AdminReview | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!review} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-2xl">
        {review && (
          <>
            <DialogHeader>
              <DialogTitle>Review details</DialogTitle>
              <DialogDescription>Full review content and moderation metadata.</DialogDescription>
            </DialogHeader>

            {/* Product details */}
            <Link
              href={`/admin/products/${review.productId}`}
              className="group mt-4 flex items-center justify-between gap-3 rounded-xl border bg-elevated p-4 transition-colors hover:border-brand"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Package className="size-5 text-muted-foreground" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{review.product?.name ?? 'Product'}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {review.product?.slug ?? review.productId}
                  </p>
                </div>
              </div>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand"
                aria-hidden
              />
            </Link>

            {/* Rating + status */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2">
                <StarRating value={review.rating} size="md" />
                <span className="text-sm font-medium tabular-nums">{review.rating}/5</span>
              </span>
              <ReviewStatusBadge status={review.status} />
            </div>

            {/* Review body */}
            <div className="mt-4 rounded-xl border p-4">
              {review.title && (
                <h3 className="font-heading text-lg font-semibold">{review.title}</h3>
              )}
              {review.body ? (
                <p className="mt-1 whitespace-pre-line text-sm leading-[1.6] text-muted-foreground">
                  {review.body}
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No review text.</p>
              )}
              {review.user && (
                <p className="mt-2 text-sm font-medium">
                  By {review.user.firstName} {review.user.lastName}
                </p>
              )}
            </div>

            {/* Metadata */}
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Meta label="Submitted" value={formatDate(review.createdAt)} />
              <Meta label="Last updated" value={formatDate(review.updatedAt)} />
            </dl>

            <DialogFooter className="mt-6" showCloseButton />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'truncate font-mono text-xs' : ''}>{value}</dd>
    </div>
  );
}
