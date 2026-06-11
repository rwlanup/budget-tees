'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useOrders } from '../queries';
import {
  FULFILLMENT_METHODS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type FulfillmentMethod,
  type OrderStatus,
  type PaymentStatus,
} from '../types';
import { OrderStatusBadge, PaymentStatusBadge } from './order-badges';

const PAGE_SIZE = 20;
const ALL = 'all';

function titleCase(s: string) {
  return s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function OrdersTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const status = (searchParams.get('status') as OrderStatus | null) ?? undefined;
  const paymentStatus = (searchParams.get('paymentStatus') as PaymentStatus | null) ?? undefined;
  const fulfillmentMethod =
    (searchParams.get('fulfillmentMethod') as FulfillmentMethod | null) ?? undefined;

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

  const { data, isLoading, isError, refetch } = useOrders({
    page,
    limit: PAGE_SIZE,
    status,
    paymentStatus,
    fulfillmentMethod,
  });

  const orders = data?.items ?? [];
  const isEmpty = !isLoading && !isError && orders.length === 0;
  const hasFilters = !!(status || paymentStatus || fulfillmentMethod);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={status ?? ALL} onValueChange={(v) => setParams({ status: v, page: 1 })}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {titleCase(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={paymentStatus ?? ALL}
          onValueChange={(v) => setParams({ paymentStatus: v, page: 1 })}
        >
          <SelectTrigger className="sm:w-44" aria-label="Filter by payment">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {titleCase(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={fulfillmentMethod ?? ALL}
          onValueChange={(v) => setParams({ fulfillmentMethod: v, page: 1 })}
        >
          <SelectTrigger className="sm:w-40" aria-label="Filter by method">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All methods</SelectItem>
            {FULFILLMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {titleCase(m)}
              </SelectItem>
            ))}
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
            icon={ShoppingBag}
            title={hasFilters ? 'No orders match' : 'No orders yet'}
            description={
              hasFilters ? 'Try adjusting filters.' : 'Orders placed by customers appear here.'
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                >
                  <TableCell>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatDate(o.createdAt)}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {o.contactEmail}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(o.grandTotal, o.currency)}
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px]">
                      {o.fulfillmentMethod}
                    </Badge>
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
    </div>
  );
}
