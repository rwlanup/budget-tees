'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';
import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import { useCustomerOrder, useReconcileEsewa } from '@/modules/checkout/queries';
import { cartKeys } from '@/modules/cart/queries';

function ResultInner() {
  const sp = useSearchParams();
  const orderNumber = sp.get('order') ?? '';
  const statusParam = sp.get('status');
  const { currency } = useStoreConfig();
  const qc = useQueryClient();

  // Cart was converted server-side on a successful order — refresh local cart cache.
  React.useEffect(() => {
    qc.invalidateQueries({ queryKey: cartKeys.all });
  }, [qc]);

  const { data: order, isLoading } = useCustomerOrder(orderNumber, statusParam !== 'failed');

  // Actively reconcile eSewa status (server-side check) while the payment is settling.
  useReconcileEsewa(
    orderNumber,
    statusParam !== 'failed' && order?.paymentMethod !== 'COD' && order?.paymentStatus !== 'PAID',
  );

  if (!orderNumber) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <XCircle className="mx-auto size-10 text-destructive" aria-hidden />
        <h1 className="mt-4 font-heading text-xl font-bold">Order not found</h1>
        <Button asChild className="mt-6">
          <Link href="/shop">Back to shop</Link>
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const failed =
    statusParam === 'failed' || order?.paymentStatus === 'FAILED' || order?.status === 'CANCELLED';
  const isCod = order?.paymentMethod === 'COD';
  const paid = order?.paymentStatus === 'PAID';
  const pendingOnline = !isCod && !paid && !failed;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card className="p-8 text-center">
        {failed ? (
          <XCircle className="mx-auto size-12 text-destructive" aria-hidden />
        ) : pendingOnline ? (
          <Clock className="mx-auto size-12 text-warning-foreground" aria-hidden />
        ) : (
          <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        )}
        <h1 className="mt-4 font-heading text-2xl font-bold">
          {failed ? 'Payment failed' : pendingOnline ? 'Confirming payment…' : 'Order confirmed'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {failed
            ? 'Your payment didn’t go through. Your cart is still saved — you can try again.'
            : pendingOnline
              ? 'We’re verifying your payment. This page updates automatically.'
              : isCod
                ? 'Thank you! Pay with cash when your order arrives.'
                : 'Thank you! Your payment was received.'}
        </p>
        {order && (
          <p className="mt-3 text-sm">
            Order <span className="font-mono font-medium">{order.orderNumber}</span>
            {pendingOnline && <Loader2 className="ml-2 inline size-4 animate-spin" aria-hidden />}
          </p>
        )}
      </Card>

      {order && (
        <Card className="p-6">
          <h2 className="font-heading font-semibold">Summary</h2>
          <ul className="mt-3 space-y-2">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0">
                  <span className="line-clamp-1">{it.productName}</span>
                  <span className="text-muted-foreground">× {it.quantity}</span>
                </span>
                <span className="tabular-nums">{formatCurrency(it.lineTotal, currency)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-3" />
          <dl className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatCurrency(order.subtotal, currency)} />
            {order.discountTotal > 0 && (
              <Row label="Discount" value={`−${formatCurrency(order.discountTotal, currency)}`} />
            )}
            <Row label="Shipping" value={formatCurrency(order.shippingCost, currency)} />
            <div className="flex justify-between pt-1 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency(order.grandTotal, currency)}</dd>
            </div>
          </dl>
        </Card>
      )}

      <div className="flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/account/orders">My orders</Link>
        </Button>
        <Button asChild>
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
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

export default function CheckoutResultPage() {
  return (
    <StorefrontContainer className="py-12">
      <Suspense fallback={null}>
        <ResultInner />
      </Suspense>
    </StorefrontContainer>
  );
}
