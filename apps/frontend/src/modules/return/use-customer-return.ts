'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';
import type { Order, OrderItem } from '@/modules/order/types';
import type { ReturnableItem } from './api';
import { useCreateReturn, useReturnable } from './queries';
import { createReturnSchema } from './schemas';
import type { ResolutionType, ReturnReason } from './types';

interface LineState {
  checked: boolean;
  quantity: number;
  exchangeSkuId: string | null;
}

export interface ReturnRow {
  ri: ReturnableItem;
  oi: OrderItem;
}

/**
 * Owns the customer return-request flow: eligibility fetch, per-line selection
 * state, validation + submission. The dialog is pure presentation over this.
 */
export function useCustomerReturn(order: Order, open: boolean, onClose: () => void) {
  const { data, isLoading, isError } = useReturnable(order.id, open);
  const create = useCreateReturn(order.id);

  const [resolutionType, setResolutionType] = React.useState<ResolutionType>('REFUND');
  const [reason, setReason] = React.useState<ReturnReason>('DAMAGED');
  const [note, setNote] = React.useState('');
  const [lines, setLines] = React.useState<Record<string, LineState>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Reset whenever the dialog re-opens.
  React.useEffect(() => {
    if (open) {
      setResolutionType('REFUND');
      setReason('DAMAGED');
      setNote('');
      setLines({});
      setFormError(null);
    }
  }, [open]);

  // Eligible lines = returnable > 0, joined to the order item for product/sku details.
  const rows: ReturnRow[] = (data?.items ?? [])
    .filter((ri) => ri.returnable > 0)
    .map((ri) => ({ ri, oi: order.items.find((i) => i.id === ri.orderItemId) }))
    .filter((r): r is ReturnRow => !!r.oi);

  const setLine = (orderItemId: string, patch: Partial<LineState>) =>
    setLines((prev) => {
      const existing = prev[orderItemId];
      const base: LineState = existing ?? { checked: false, quantity: 1, exchangeSkuId: null };
      const next: LineState = { ...base, ...patch };
      // Bail out when nothing actually changed — the exchange picker re-emits its
      // value via an effect on every render, so without this a no-op patch would
      // trigger an endless setState→re-render loop ("Maximum update depth exceeded").
      if (
        existing &&
        existing.checked === next.checked &&
        existing.quantity === next.quantity &&
        existing.exchangeSkuId === next.exchangeSkuId
      ) {
        return prev;
      }
      return { ...prev, [orderItemId]: next };
    });

  const submit = () => {
    setFormError(null);
    const items = rows
      .filter((r) => lines[r.ri.orderItemId]?.checked)
      .map((r) => {
        const ls = lines[r.ri.orderItemId];
        return {
          orderItemId: r.ri.orderItemId,
          quantity: ls.quantity,
          exchangeSkuId:
            resolutionType === 'EXCHANGE' ? (ls.exchangeSkuId ?? undefined) : undefined,
        };
      });

    const parsed = createReturnSchema.safeParse({
      resolutionType,
      reason,
      customerNote: note || undefined,
      items,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Please review the form.');
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: (r) => {
        toast.success(`Return ${r.returnNumber} requested`);
        onClose();
      },
      onError: (err) =>
        setFormError(err instanceof ApiError ? err.messages[0] : 'Couldn’t submit return.'),
    });
  };

  const eligible = data?.eligible && rows.length > 0;

  return {
    isLoading,
    isError,
    /** Eligibility check resolved but nothing returnable. */
    ineligible: !!data && !eligible,
    eligible,
    rows,
    lines,
    setLine,
    resolutionType,
    setResolutionType,
    reason,
    setReason,
    note,
    setNote,
    formError,
    submit,
    isPending: create.isPending,
  };
}
