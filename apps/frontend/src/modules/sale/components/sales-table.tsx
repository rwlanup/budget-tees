'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Percent, Trash2 } from 'lucide-react';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { useDeleteSale, useSales } from '../queries';
import type { Sale } from '../types';
import { SaleStatusBadge } from './sale-status-badge';

const PAGE_SIZE = 20;
const ALL = 'all';

function discountLabel(sale: Sale) {
  return sale.type === 'PERCENTAGE' ? `${sale.value}%` : `${formatCurrency(sale.value)} off`;
}

export function SalesTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const status =
    (searchParams.get('status') as 'active' | 'upcoming' | 'expired' | null) ?? undefined;

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

  const { data, isLoading, isError, refetch } = useSales({ page, limit: PAGE_SIZE, status });

  const deleteSale = useDeleteSale();
  const [target, setTarget] = React.useState<Sale | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteSale.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Sale "${target.name}" deleted`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete sale'),
    });
  };

  const sales = data?.items ?? [];
  const isEmpty = !isLoading && !isError && sales.length === 0;

  return (
    <div className="space-y-4">
      <Select value={status ?? ALL} onValueChange={(v) => setParams({ status: v, page: 1 })}>
        <SelectTrigger className="w-44" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All sales</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="upcoming">Upcoming</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Percent}
            title={status ? 'No sales match' : 'No sales yet'}
            description={status ? 'Try a different status.' : 'Create a scheduled discount.'}
            action={
              !status ? (
                <Button asChild>
                  <Link href="/admin/sales/new">New sale</Link>
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
                <TableHead>Name</TableHead>
                <TableHead className="w-28">Discount</TableHead>
                <TableHead className="hidden sm:table-cell">Scope</TableHead>
                <TableHead className="hidden lg:table-cell">Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <Link href={`/admin/sales/${sale.id}`} className="font-medium hover:underline">
                      {sale.name}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">{discountLabel(sale)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px]">
                      {sale.scope}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDate(sale.startsAt)} → {formatDate(sale.endsAt)}
                  </TableCell>
                  <TableCell>
                    <SaleStatusBadge sale={sale} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${sale.name}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/sales/${sale.id}`}>
                            <Pencil className="size-4" aria-hidden />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteError(null);
                            setTarget(sale);
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
        title={`Delete "${target?.name}"?`}
        description="This removes the sale. Placed orders keep their snapshotted prices."
        confirmLabel="Delete sale"
        destructive
        loading={deleteSale.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
