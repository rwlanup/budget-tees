'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/modules/order/types';
import { useMarkOrderPaid } from '../queries';
import { PaymentStatusBadge } from './payment-status-badge';

/** Payments + refunds for an order, with an inline admin mark-paid action. */
export function OrderPaymentsCard({ order }: { order: Order }) {
  const payments = order.payments ?? [];
  const markPaid = useMarkOrderPaid();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canMarkPaid = order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED';

  const confirmMarkPaid = () => {
    setError(null);
    markPaid.mutate(order.id, {
      onSuccess: () => {
        toast.success(`${order.orderNumber} marked paid`);
        setConfirmOpen(false);
      },
      onError: (err) =>
        setError(err instanceof ApiError ? err.messages[0] : 'Couldn’t mark paid'),
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">Payments</CardTitle>
        {canMarkPaid && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setError(null);
              setConfirmOpen(true);
            }}
          >
            <CheckCircle2 className="size-4" aria-hidden />
            Mark paid
          </Button>
        )}
      </CardHeader>
      <CardContent className={payments.length ? 'p-0' : undefined}>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payment records for this order yet.</p>
        ) : (
          <ul className="divide-y">
            {payments.map((p) => {
              const refunds = p.refunds ?? [];
              return (
                <li key={p.id} className="space-y-2 px-6 py-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Badge variant="outline" className="text-[10px]">
                      {p.method}
                    </Badge>
                    <PaymentStatusBadge status={p.status} />
                    <span className="text-sm tabular-nums">
                      {formatCurrency(p.amount, p.currency)}
                    </span>
                    {(p.gatewayTxnId || p.gatewayRef) && (
                      <code className="text-xs text-muted-foreground">
                        {p.gatewayTxnId ?? p.gatewayRef}
                      </code>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(p.paidAt ?? p.createdAt)}
                    </span>
                  </div>

                  {refunds.length > 0 && (
                    <ul className="space-y-1 border-l pl-3">
                      {refunds.map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
                        >
                          <span className="font-medium text-foreground">
                            Refund −{formatCurrency(r.amount, p.currency)}
                          </span>
                          <span>{r.reason}</span>
                          {r.externalRef && <code>{r.externalRef}</code>}
                          <span className="ml-auto">{formatDate(r.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => !o && setConfirmOpen(false)}
        title={`Mark ${order.orderNumber} as paid?`}
        description="Records payment for this order — use for COD cash collected or an offline transfer. A pending order is also confirmed and its reserved stock committed."
        confirmLabel="Mark paid"
        loading={markPaid.isPending}
        errorMessage={error}
        onConfirm={confirmMarkPaid}
      />
    </Card>
  );
}
