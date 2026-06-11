'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useStoreConfig } from '@/lib/storefront/use-store-config';
import type { Order } from '@/modules/order/types';
import { useCancelReturn, useMyReturns } from '../queries';
import {
  CANCELLABLE_RETURN_STATUSES,
  RETURNABLE_ORDER_STATUSES,
  type ReturnRequest,
} from '../types';
import { ReturnStatusBadge } from './return-status-badge';
import { CustomerReturnDialog } from './customer-return-dialog';

const RETURNABLE = new Set<string>(RETURNABLE_ORDER_STATUSES);

export function CustomerReturnsSection({ order }: { order: Order }) {
  const { currency } = useStoreConfig();
  const { data } = useMyReturns({ limit: 100 });
  const cancel = useCancelReturn();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<ReturnRequest | null>(null);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  const returns = (data?.items ?? []).filter((r) => r.orderId === order.id);
  const canRequest = RETURNABLE.has(order.status) && order.paymentStatus === 'PAID';

  // Nothing to show: not returnable and no prior returns.
  if (!canRequest && returns.length === 0) return null;

  const confirmCancel = () => {
    if (!cancelTarget) return;
    setCancelError(null);
    cancel.mutate(cancelTarget.id, {
      onSuccess: () => {
        toast.success('Return cancelled');
        setCancelTarget(null);
      },
      onError: (err) =>
        setCancelError(err instanceof ApiError ? err.messages[0] : 'Could not cancel'),
    });
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading font-semibold">Returns</h2>
        {canRequest && (
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Undo2 className="size-4" aria-hidden />
            Request a return
          </Button>
        )}
      </div>

      {returns.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Changed your mind or received the wrong item? Start a return above.
        </p>
      ) : (
        <ul className="divide-y">
          {returns.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="font-mono text-sm font-medium">{r.returnNumber}</span>
              <ReturnStatusBadge status={r.status} />
              <span className="text-xs text-muted-foreground">{r.resolutionType}</span>
              {r.refundAmount != null && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  Refund {formatCurrency(r.refundAmount, currency)}
                </span>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(r.createdAt)}
              </span>
              {CANCELLABLE_RETURN_STATUSES.includes(r.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    setCancelError(null);
                    setCancelTarget(r);
                  }}
                >
                  Cancel
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <CustomerReturnDialog order={order} open={dialogOpen} onOpenChange={setDialogOpen} />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancel this return?"
        description="The return request will be withdrawn. You can start a new one later if the order is still eligible."
        confirmLabel="Cancel return"
        destructive
        loading={cancel.isPending}
        errorMessage={cancelError}
        onConfirm={confirmCancel}
      />
    </Card>
  );
}
