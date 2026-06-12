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
import { ProductImage } from '@/components/storefront/product-image';
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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">Orders</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Track and review your purchases.</p>
        </div>
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
            <Skeleton key={i} className="shimmer h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          className="bg-aurora"
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
            {orders.map((o) => {
              const count = o.items.length;
              const hasImages = o.items.some((it) => it.imageUrl);
              const names = o.items.map((it) => it.productName);
              const preview =
                names.slice(0, 2).join(', ') +
                (names.length > 2 ? ` +${names.length - 2} more` : '');
              const extra = count - 4;

              return (
                <li key={o.id}>
                  <Link href={`/account/orders/${o.orderNumber}`} className="group block">
                    <Card className="press overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex flex-col gap-4 p-4 sm:p-5">
                        {/* header: order id + status badges */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-muted text-brand">
                              <Package className="size-5" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm font-semibold leading-tight">
                                {o.orderNumber}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                {o.placedAt ? formatDate(o.placedAt) : '—'} · {count} item
                                {count > 1 ? 's' : ''} ·{' '}
                                {o.fulfillmentMethod === 'PICKUP' ? 'Pickup' : 'Delivery'}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                            <OrderStatusBadge status={o.status} />
                            <PaymentStatusBadge status={o.paymentStatus} />
                          </div>
                        </div>

                        {/* item preview: thumbnail stack (when images exist) + names */}
                        <div className="flex items-center gap-3">
                          {hasImages && (
                            <div className="flex shrink-0 -space-x-3">
                              {o.items.slice(0, 4).map((it) => (
                                <ProductImage
                                  key={it.id}
                                  src={it.imageUrl}
                                  alt={it.productName}
                                  className="size-11 ring-2 ring-card"
                                />
                              ))}
                              {extra > 0 && (
                                <div className="grid size-11 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold tabular-nums text-muted-foreground ring-2 ring-card">
                                  +{extra}
                                </div>
                              )}
                            </div>
                          )}
                          <p className="line-clamp-1 text-sm text-muted-foreground">{preview}</p>
                        </div>

                        {/* footer: total + view affordance */}
                        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Total
                            </p>
                            <p className="font-heading text-base font-bold tabular-nums">
                              {formatCurrency(o.grandTotal, currency)}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                            View details
                            <ChevronRight
                              className="size-4 transition-transform group-hover:translate-x-0.5"
                              aria-hidden
                            />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
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
