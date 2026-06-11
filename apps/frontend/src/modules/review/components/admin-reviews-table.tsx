'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, MessageSquare, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { useAdminDeleteReview, useAdminReviews, useSetReviewStatus } from '../queries';
import type { AdminReview, ReviewStatus } from '../types';
import { ReviewStatusBadge } from './review-status-badge';

const PAGE_SIZE = 20;
const ALL = 'all';
const STATUSES: ReviewStatus[] = ['PUBLISHED', 'HIDDEN'];

export function AdminReviewsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const status = (searchParams.get('status') as ReviewStatus | null) ?? undefined;

  const setParams = React.useCallback(
    (next: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === '' || v === ALL) params.delete(k);
        else params.set(k, String(v));
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const { data, isLoading, isError, refetch } = useAdminReviews({ page, limit: PAGE_SIZE, status });
  const setStatus = useSetReviewStatus();
  const remove = useAdminDeleteReview();

  const [deleteTarget, setDeleteTarget] = React.useState<AdminReview | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const reviews = data?.items ?? [];
  const isEmpty = !isLoading && !isError && reviews.length === 0;

  const toggleStatus = (r: AdminReview) => {
    const next: ReviewStatus = r.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    setStatus.mutate(
      { id: r.id, status: next },
      {
        onSuccess: () => toast.success(next === 'PUBLISHED' ? 'Review published' : 'Review hidden'),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Could not update review'),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Review deleted');
        setDeleteTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Could not delete review'),
    });
  };

  return (
    <div className="space-y-4">
      <Select value={status ?? ALL} onValueChange={(v) => setParams({ status: v, page: 1 })}>
        <SelectTrigger className="sm:w-44" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s === 'PUBLISHED' ? 'Published' : 'Hidden'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={MessageSquare}
            title={status ? 'No reviews match' : 'No reviews yet'}
            description={
              status ? 'Try a different status filter.' : 'Customer reviews appear here.'
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Review</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="hidden md:table-cell">Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-sm">
                    {r.title && <span className="font-medium">{r.title}</span>}
                    {r.body && (
                      <span className="line-clamp-2 text-sm text-muted-foreground">{r.body}</span>
                    )}
                    {!r.title && !r.body && (
                      <span className="text-sm text-muted-foreground">No text</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Star className="size-3.5 fill-warning text-warning" aria-hidden />
                      {r.rating}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Link
                      href={`/admin/products/${r.productId}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {r.productId.slice(0, 8)}…
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ReviewStatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDate(r.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Review actions">
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => toggleStatus(r)}>
                          {r.status === 'PUBLISHED' ? (
                            <>
                              <EyeOff className="size-4" aria-hidden />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="size-4" aria-hidden />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => {
                            setDeleteError(null);
                            setDeleteTarget(r);
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={(p) => setParams({ page: p })}
          />
        )}
      </DataState>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this review?"
        description="The review is permanently removed. To temporarily take it down, hide it instead."
        confirmLabel="Delete review"
        destructive
        loading={remove.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
