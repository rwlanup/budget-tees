'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, apiDownload } from '@/lib/api/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataState } from '@/components/shared/data-state';
import { formatCurrency, formatDate } from '@/lib/utils';
import { OrderReturnsCard } from '@/modules/return/components/order-returns-card';
import { OrderPaymentsCard } from '@/modules/payment/components/order-payments-card';
import { useOrder } from '../queries';
import type { AddressSnapshot, Order } from '../types';
import { OrderStatusBadge, PaymentStatusBadge } from './order-badges';
import { OrderStatusActions } from './order-status-actions';

function AddressBlock({ address }: { address: AddressSnapshot }) {
  return (
    <div className="text-sm text-muted-foreground">
      {address.recipientName && (
        <p className="font-medium text-foreground">{address.recipientName}</p>
      )}
      {address.phone && <p>{address.phone}</p>}
      {address.line1 && <p>{address.line1}</p>}
      {address.line2 && <p>{address.line2}</p>}
      <p>{[address.city, address.region, address.postalCode].filter(Boolean).join(', ')}</p>
      {address.countryCode && <p>{address.countryCode}</p>}
      {address.nearestLandmark && <p>Landmark: {address.nearestLandmark}</p>}
    </div>
  );
}

function Summary({ order }: { order: Order }) {
  const row = (label: string, value: string, opts?: { strong?: boolean; muted?: boolean }) => (
    <div className={`flex justify-between text-sm ${opts?.strong ? 'font-semibold' : ''}`}>
      <span className={opts?.muted ? 'text-muted-foreground' : ''}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
  const c = order.currency;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {row('Subtotal', formatCurrency(order.subtotal, c))}
        {order.saleSavings > 0 &&
          row('Sale savings', `−${formatCurrency(order.saleSavings, c)}`, { muted: true })}
        {order.discountTotal > 0 &&
          row(
            `Coupon${order.couponCode ? ` (${order.couponCode})` : ''}`,
            `−${formatCurrency(order.discountTotal, c)}`,
            { muted: true },
          )}
        {row('Shipping', formatCurrency(order.shippingCost, c))}
        <Separator />
        {row('Grand total', formatCurrency(order.grandTotal, c), { strong: true })}
        <p className="pt-1 text-xs text-muted-foreground">
          Includes {formatCurrency(order.taxTotal, c)} tax (tax-inclusive pricing).
        </p>
      </CardContent>
    </Card>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const { data: order, isLoading, isError, refetch } = useOrder(id);

  return (
    <DataState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      loadingFallback={<Skeleton className="h-96 w-full" />}
    >
      {order && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
            <Badge variant="outline">{order.fulfillmentMethod}</Badge>
            <span className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</span>
            <InvoiceButton orderId={order.id} orderNumber={order.orderNumber} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusActions order={order} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Line</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell>
                            <span className="font-medium">{it.productName}</span>
                            <span className="block text-xs text-muted-foreground">
                              <code>{it.skuCode}</code>
                              {it.variant && Object.keys(it.variant).length > 0
                                ? ` · ${Object.values(it.variant).join(' / ')}`
                                : ''}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(it.unitPrice, order.currency)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(it.lineTotal, order.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {order.customerNote && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer note</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{order.customerNote}</p>
                  </CardContent>
                </Card>
              )}

              <OrderPaymentsCard order={order} />
              <OrderReturnsCard orderId={order.id} />
            </div>

            <div className="space-y-6">
              <Summary order={order} />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{order.contactEmail}</p>
                  <p>{order.contactPhone}</p>
                  <p className="pt-1">Payment: {order.paymentMethod}</p>
                  {order.paidAt && <p>Paid: {formatDate(order.paidAt)}</p>}
                </CardContent>
              </Card>

              {order.fulfillmentMethod === 'DELIVERY' ? (
                order.shippingAddress && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Shipping address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AddressBlock address={order.shippingAddress} />
                      {(order.trackingCarrier || order.trackingNumber) && (
                        <p className="mt-3 text-sm">
                          Tracking: {order.trackingCarrier} {order.trackingNumber}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pickup</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {order.pickupLocation
                      ? String((order.pickupLocation as { name?: string }).name ?? 'Store pickup')
                      : 'Store pickup'}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </DataState>
  );
}

function InvoiceButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [loading, setLoading] = React.useState(false);
  const download = async () => {
    setLoading(true);
    try {
      await apiDownload(`/admin/orders/${orderId}/invoice`, `invoice-${orderNumber}.pdf`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.messages[0] : 'Could not download invoice');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant="outline" size="sm" className="ml-auto" onClick={download} disabled={loading}>
      <Download className="size-4" aria-hidden />
      {loading ? 'Preparing…' : 'Invoice'}
    </Button>
  );
}
