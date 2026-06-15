'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/modules/order/components/order-badges';
import { useRecentOrders } from '../queries';

export function RecentOrders() {
  const { data, isLoading, isError, refetch } = useRecentOrders(6);
  const orders = data ?? [];

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex-row items-center justify-between flex gap-4 space-y-0 border-b pb-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Commerce
          </p>
          <CardTitle className="font-heading text-lg">Recent orders</CardTitle>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-brand hover:text-brand-strong">
          <Link href="/admin/orders">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <DataState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && !isError && orders.length === 0}
          loadingFallback={
            <div className="p-6">
              <Skeleton className="h-40 w-full" />
            </div>
          }
          emptyFallback={
            <div className="p-6">
              <EmptyState icon={ShoppingBag} title="No orders yet" />
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="group transition-colors">
                  <TableCell>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium tabular-nums transition-colors group-hover:text-brand"
                    >
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {formatDate(o.createdAt)}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </CardContent>
    </Card>
  );
}
