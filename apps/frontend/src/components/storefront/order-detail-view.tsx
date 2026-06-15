'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Download,
  ChevronRight,
  Truck,
  MapPin,
  Mail,
  CreditCard,
  StickyNote,
  Receipt,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Reveal } from '@/components/motion/reveal';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ProductImage } from './product-image';
import { OrderStatusBadge, PaymentStatusBadge } from './order-status-badge';
import { OrderTracking } from './order-tracking';
import { ApiError, apiDownload } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import { useCancelOrder, useInitiatePayment } from '@/modules/checkout/queries';
import { gatewayRedirect } from '@/modules/checkout/gateway';
import { CustomerReturnsSection } from '@/modules/return/components/customer-returns-section';
import type { Order } from '@/modules/order/types';

const CANCELLABLE = new Set(['PENDING', 'CONFIRMED', 'PROCESSING']);

/** Customer-friendly labels for individual payment attempts. */
const PAYMENT_RECORD_LABEL: Record<string, string> = {
  INITIATED: 'Initiated',
  PENDING: 'Pending',
  SUCCESS: 'Paid',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially refunded',
};

export function OrderDetailView({ order }: { order: Order }) {
  const { currency } = useStoreConfig();
  const cancel = useCancelOrder();
  const initiate = useInitiatePayment();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  const unpaid = order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED';
  const [downloading, setDownloading] = React.useState(false);

  const downloadInvoice = async () => {
    setDownloading(true);
    try {
      await apiDownload(`/orders/${order.orderNumber}/invoice`, `invoice-${order.orderNumber}.pdf`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.messages[0] : 'Could not download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const payWithEsewa = () => {
    initiate.mutate(
      { orderId: order.id, method: 'ESEWA', idempotencyKey: crypto.randomUUID() },
      {
        onSuccess: (res) => {
          if (res.redirect) gatewayRedirect(res.redirect);
          else toast.error('Could not start payment');
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Could not start payment'),
      },
    );
  };

  const addr = order.shippingAddress;
  const billing = order.billingAddress;
  const pickup = order.pickupLocation as { name?: string; line1?: string; city?: string } | null;

  const confirmCancel = () => {
    setCancelError(null);
    cancel.mutate(order.orderNumber, {
      onSuccess: () => {
        toast.success('Order cancelled');
        setConfirmOpen(false);
      },
      onError: (err) =>
        setCancelError(err instanceof ApiError ? err.messages[0] : 'Could not cancel'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/account/orders" className="transition-colors hover:text-foreground">
              Orders
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>
          </nav>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight">
            Order {order.orderNumber}
          </h1>
          {order.placedAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              Placed {formatDate(order.placedAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <OrderTracking status={order.status} method={order.fulfillmentMethod} />
        {order.trackingNumber && (
          <p className="mt-4 text-sm text-muted-foreground">
            Tracking: {order.trackingCarrier ? `${order.trackingCarrier} · ` : ''}
            <span className="font-medium text-foreground">{order.trackingNumber}</span>
          </p>
        )}
      </Card>

      <Reveal as="div" className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="gap-0 overflow-hidden p-0">
          <ul className="divide-y">
            {order.items.map((it) => (
              <li key={it.id}>
                <Link
                  href={`/product/${it.productId}`}
                  className="group flex items-center gap-4 p-4 transition-colors hover:bg-accent/40"
                >
                  <div className="w-16 shrink-0 overflow-hidden rounded-lg border">
                    <ProductImage src={it.imageUrl} alt={it.productName} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium transition-colors group-hover:text-brand">
                      {it.productName}
                    </p>
                    {it.variant && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {Object.values(it.variant).join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(it.unitPrice, currency)} × {it.quantity}
                    </p>
                  </div>
                  <div className="text-right font-medium tabular-nums">
                    {formatCurrency(it.lineTotal, currency)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-heading font-semibold">Total</h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(order.subtotal, currency)} />
              {order.discountTotal > 0 && (
                <Row
                  label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                  value={`−${formatCurrency(order.discountTotal, currency)}`}
                />
              )}
              <Row label="Shipping" value={formatCurrency(order.shippingCost, currency)} />
              <Row label="Tax (incl.)" value={formatCurrency(order.taxTotal, currency)} />
              <Separator className="my-1" />
              <div className="flex items-baseline justify-between font-semibold">
                <dt>Grand total</dt>
                <dd className="font-heading text-lg tabular-nums">
                  {formatCurrency(order.grandTotal, currency)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-3 p-5 text-sm">
            <div>
              <h3 className="flex items-center gap-2 font-medium mb-1">
                {order.fulfillmentMethod === 'PICKUP' ? (
                  <MapPin className="size-4 text-muted-foreground" aria-hidden />
                ) : (
                  <Truck className="size-4 text-muted-foreground" aria-hidden />
                )}
                {order.fulfillmentMethod === 'PICKUP' ? 'Pickup' : 'Delivery'}
              </h3>
              {order.fulfillmentMethod === 'PICKUP' ? (
                <p className="text-muted-foreground">
                  {pickup?.name}
                  {pickup?.line1 ? `, ${pickup.line1}` : ''}
                  {pickup?.city ? `, ${pickup.city}` : ''}
                </p>
              ) : addr ? (
                <p className="text-muted-foreground">
                  {addr.recipientName}, {addr.phone}
                  <br />
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}
                  {addr.region ? `, ${addr.region}` : ''} · {addr.countryCode}
                </p>
              ) : null}
            </div>
            <Separator />
            <div>
              <h3 className="flex items-center gap-2 font-medium mb-1">
                <Receipt className="size-4 text-muted-foreground" aria-hidden />
                Billing
              </h3>
              {billing ? (
                <p className="text-muted-foreground">
                  {billing.recipientName}
                  {billing.phone ? `, ${billing.phone}` : ''}
                  <br />
                  {billing.line1}
                  {billing.line2 ? `, ${billing.line2}` : ''}
                  {billing.city ? `, ${billing.city}` : ''}
                  {billing.region ? `, ${billing.region}` : ''}
                  {billing.countryCode ? ` · ${billing.countryCode}` : ''}
                </p>
              ) : (
                <p className="text-muted-foreground">{addr ? 'Same as delivery address' : '—'}</p>
              )}
            </div>
            <Separator />
            <div>
              <h3 className="flex items-center gap-2 font-medium mb-1">
                <Mail className="size-4 text-muted-foreground" aria-hidden />
                Contact
              </h3>
              <p className="text-muted-foreground">
                {order.contactEmail} · {order.contactPhone}
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="flex items-center gap-2 font-medium mb-1">
                <CreditCard className="size-4 text-muted-foreground" aria-hidden />
                Payment
              </h3>
              <p className="text-muted-foreground">{order.paymentMethod}</p>
              {order.payments && order.payments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {order.payments.map((p) => (
                    <li key={p.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {p.method} · {PAYMENT_RECORD_LABEL[p.status] ?? p.status}
                      </span>
                      <span className="tabular-nums">{formatCurrency(p.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {order.customerNote && (
              <>
                <Separator />
                <div>
                  <h3 className="flex items-center gap-2 font-medium mb-1">
                    <StickyNote className="size-4 text-muted-foreground" aria-hidden />
                    Note
                  </h3>
                  <p className="text-muted-foreground">{order.customerNote}</p>
                </div>
              </>
            )}
          </Card>

          {unpaid && (
            <Button
              variant="brand"
              className="w-full"
              onClick={payWithEsewa}
              disabled={initiate.isPending}
            >
              {initiate.isPending ? 'Starting payment…' : 'Pay with eSewa'}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={downloadInvoice}
            disabled={downloading}
          >
            <Download className="size-4" aria-hidden />
            {downloading ? 'Preparing…' : 'Download invoice'}
          </Button>

          {CANCELLABLE.has(order.status) && (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => {
                setCancelError(null);
                setConfirmOpen(true);
              }}
            >
              Cancel order
            </Button>
          )}
        </div>
      </Reveal>

      <CustomerReturnsSection order={order} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Cancel this order?"
        description="Reserved stock is released. This can’t be undone."
        confirmLabel="Cancel order"
        destructive
        loading={cancel.isPending}
        errorMessage={cancelError}
        onConfirm={confirmCancel}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
