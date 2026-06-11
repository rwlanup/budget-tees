'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { useReceive, useResolve, useReview } from '../queries';
import { ITEM_CONDITIONS, type ItemCondition, type ReturnRequest } from '../types';

export function ReviewPanel({ request }: { request: ReturnRequest }) {
  const review = useReview(request.id);
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState<string[] | null>(null);

  const act = (decision: 'APPROVE' | 'REJECT') => {
    setError(null);
    review.mutate(
      { decision, adminNote: note || undefined },
      {
        onSuccess: () =>
          toast.success(decision === 'APPROVE' ? 'Return approved' : 'Return rejected'),
        onError: (err) => setError(err instanceof ApiError ? err.messages : ['Failed to review']),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError messages={error} />
        <div className="space-y-2">
          <Label htmlFor="review-note">Admin note (optional)</Label>
          <Textarea
            id="review-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => act('APPROVE')} disabled={review.isPending}>
            Approve
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => act('REJECT')}
            disabled={review.isPending}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReceiveState {
  conditionOnReceipt: ItemCondition;
  restock: boolean;
}

export function ReceivePanel({
  request,
  itemName,
}: {
  request: ReturnRequest;
  itemName: (orderItemId: string) => string;
}) {
  const receive = useReceive(request.id);
  const [rows, setRows] = React.useState<Record<string, ReceiveState>>(() =>
    Object.fromEntries(
      request.items.map((i) => [
        i.id,
        { conditionOnReceipt: 'SELLABLE' as ItemCondition, restock: true },
      ]),
    ),
  );
  const [error, setError] = React.useState<string[] | null>(null);

  const setRow = (id: string, patch: Partial<ReceiveState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const submit = () => {
    setError(null);
    receive.mutate(
      { items: request.items.map((i) => ({ returnItemId: i.id, ...rows[i.id] })) },
      {
        onSuccess: () => toast.success('Items received'),
        onError: (err) => setError(err instanceof ApiError ? err.messages : ['Failed to receive']),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Receive items</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError messages={error} />
        <div className="space-y-3">
          {request.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <p className="font-medium">{itemName(item.orderItemId)}</p>
                <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={rows[item.id].conditionOnReceipt}
                  onValueChange={(v) =>
                    setRow(item.id, {
                      conditionOnReceipt: v as ItemCondition,
                      restock: v === 'SELLABLE',
                    })
                  }
                >
                  <SelectTrigger className="w-40" aria-label="Condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0) + c.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={rows[item.id].restock}
                    onCheckedChange={(v) => setRow(item.id, { restock: v })}
                  />
                  Restock
                </label>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={submit} disabled={receive.isPending}>
          {receive.isPending ? 'Saving…' : 'Mark received'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ResolvePanel({ request }: { request: ReturnRequest }) {
  const resolve = useResolve(request.id);
  const isRefund = request.resolutionType === 'REFUND';
  const [amount, setAmount] = React.useState(
    isRefund && request.refundAmount != null ? String(request.refundAmount) : '',
  );
  const [externalRef, setExternalRef] = React.useState('');
  const [error, setError] = React.useState<string[] | null>(null);

  const submit = () => {
    setError(null);
    resolve.mutate(
      {
        refundAmount: isRefund && amount !== '' ? Number(amount) : undefined,
        externalRef: externalRef || undefined,
      },
      {
        onSuccess: () => toast.success('Return resolved'),
        onError: (err) => setError(err instanceof ApiError ? err.messages : ['Failed to resolve']),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resolve — {isRefund ? 'Refund' : 'Exchange'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormError messages={error} />
        {isRefund ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resolve-amount">Refund amount</Label>
              <Input
                id="resolve-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Provisional amount"
              />
              <p className="text-xs text-muted-foreground">
                Capped at the refundable amount. Leave as suggested unless adjusting.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolve-ref">External reference</Label>
              <Input
                id="resolve-ref"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                placeholder="Gateway refund ID (optional)"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Exchange will reserve and commit the exchange SKU.
            {request.priceDifference != null && (
              <>
                {' '}
                Price difference:{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(request.priceDifference)}
                </span>
                .
              </>
            )}
          </p>
        )}
        <Button onClick={submit} disabled={resolve.isPending}>
          {resolve.isPending ? 'Resolving…' : 'Resolve return'}
        </Button>
      </CardContent>
    </Card>
  );
}
