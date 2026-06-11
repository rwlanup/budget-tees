'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/storefront/order-status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import { useCustomerOrders } from '@/modules/checkout/queries';
import { ORDER_STATUSES } from '@/modules/order/types';

export default function OrdersPage() {
  const { currency } = useStoreConfig();
  const [status, setStatus] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);

  const { data, isLoading } = useCustomerOrders({
    page,
    limit: 10,
    status: status === 'all' ? undefined : status,
  });
  const orders = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold">Orders</h2>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders"
          description={
            status === 'all' ? 'You haven’t placed any orders yet.' : 'No orders with this status.'
          }
          action={
            <Button asChild>
              <Link href="/shop">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition-shadow hover:shadow-sm">
                    <div>
                      <p className="font-mono font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.placedAt ? formatDate(o.placedAt) : '—'} · {o.items.length} item
                        {o.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </div>
                    <div className="font-semibold tabular-nums">
                      {formatCurrency(o.grandTotal, currency)}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
