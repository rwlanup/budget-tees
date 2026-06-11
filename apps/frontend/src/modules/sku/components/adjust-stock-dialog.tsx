'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { useAdjustStock } from '../queries';
import { skuAvailable, type Sku } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  sku: Sku | null;
}

export function AdjustStockDialog({ open, onOpenChange, productId, sku }: Props) {
  const adjust = useAdjustStock(productId);
  const [mode, setMode] = React.useState<'delta' | 'set'>('delta');
  const [value, setValue] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (open) {
      setMode('delta');
      setValue('');
      setReason('');
      setError(null);
    }
  }, [open]);

  const onConfirm = () => {
    if (!sku) return;
    setError(null);
    if (value === '' || !reason.trim()) {
      setError(['Enter an amount and a reason']);
      return;
    }
    const n = Number(value);
    adjust.mutate(
      {
        id: sku.id,
        body: mode === 'delta' ? { delta: n, reason } : { setTo: n, reason },
      },
      {
        onSuccess: () => {
          toast.success('Stock adjusted');
          onOpenChange(false);
        },
        onError: (err) =>
          setError(err instanceof ApiError ? err.messages : ['Failed to adjust stock']),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !adjust.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {sku?.sku}</DialogTitle>
          <DialogDescription>
            Records a ledger entry. Reserved units are system-managed and not edited here.
          </DialogDescription>
        </DialogHeader>

        {sku && (
          <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Stock</p>
              <p className="font-medium tabular-nums">{sku.stock}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reserved</p>
              <p className="font-medium tabular-nums">{sku.reserved}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="font-medium tabular-nums">{skuAvailable(sku)}</p>
            </div>
          </div>
        )}

        <FormError messages={error} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'delta' | 'set')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delta">Add / subtract</SelectItem>
                <SelectItem value="set">Set to</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adj-value">{mode === 'delta' ? 'Change (±)' : 'New stock'}</Label>
            <Input
              id="adj-value"
              type="number"
              inputMode="numeric"
              min={mode === 'set' ? 0 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === 'delta' ? 'e.g. -5 or 20' : 'e.g. 100'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="adj-reason">Reason</Label>
          <Textarea
            id="adj-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Stock take, damage, restock…"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={adjust.isPending}>
            {adjust.isPending ? 'Adjusting…' : 'Adjust stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
