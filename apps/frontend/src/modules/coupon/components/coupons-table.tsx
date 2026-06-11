'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Search, Ticket, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useDebounce } from '@/hooks/use-debounce';
import { ApiError } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { useCoupons, useDeleteCoupon } from '../queries';
import type { Coupon } from '../types';
import { CouponStatusBadge } from './coupon-status-badge';

const PAGE_SIZE = 20;
const ALL = 'all';

function discountLabel(c: Coupon) {
  if (c.type === 'FREE_SHIPPING') return 'Free shipping';
  if (c.type === 'PERCENTAGE') return `${c.value ?? 0}%`;
  return `${formatCurrency(c.value ?? 0)} off`;
}

export function CouponsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const urlSearch = searchParams.get('search') ?? '';
  const activeParam = searchParams.get('active');

  const [searchInput, setSearchInput] = React.useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 350);

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

  React.useEffect(() => {
    if (debouncedSearch !== urlSearch) setParams({ search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch } = useCoupons({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    isActive: activeParam === null ? undefined : activeParam === 'true',
  });

  const deleteCoupon = useDeleteCoupon();
  const [target, setTarget] = React.useState<Coupon | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteCoupon.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Coupon "${target.code}" deleted`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete coupon'),
    });
  };

  const coupons = data?.items ?? [];
  const isEmpty = !isLoading && !isError && coupons.length === 0;
  const hasFilters = !!(debouncedSearch || activeParam);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search code…"
            className="pl-9"
            aria-label="Search coupons"
          />
        </div>
        <Select value={activeParam ?? ALL} onValueChange={(v) => setParams({ active: v, page: 1 })}>
          <SelectTrigger className="sm:w-36" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Ticket}
            title={hasFilters ? 'No coupons match' : 'No coupons yet'}
            description={hasFilters ? 'Try adjusting filters.' : 'Create a discount code.'}
            action={
              !hasFilters ? (
                <Button asChild>
                  <Link href="/admin/coupons/new">New coupon</Link>
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead className="w-32">Discount</TableHead>
                <TableHead className="hidden sm:table-cell">Applies to</TableHead>
                <TableHead className="hidden lg:table-cell">Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/coupons/${c.id}`} className="font-medium hover:underline">
                      <code>{c.code}</code>
                    </Link>
                  </TableCell>
                  <TableCell>{discountLabel(c)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px]">
                      {c.appliesTo}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground lg:table-cell">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ' / ∞'}
                  </TableCell>
                  <TableCell>
                    <CouponStatusBadge coupon={c} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${c.code}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/coupons/${c.id}`}>
                            <Pencil className="size-4" aria-hidden />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteError(null);
                            setTarget(c);
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
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Delete "${target?.code}"?`}
        description="If the coupon has been redeemed, deletion fails — deactivate it instead."
        confirmLabel="Delete coupon"
        destructive
        loading={deleteCoupon.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
