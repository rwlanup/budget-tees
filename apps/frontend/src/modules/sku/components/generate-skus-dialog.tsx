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
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { useGenerateSkus } from '../queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}

export function GenerateSkusDialog({ open, onOpenChange, productId }: Props) {
  const generate = useGenerateSkus(productId);
  const [price, setPrice] = React.useState('');
  const [stock, setStock] = React.useState('');
  const [prefix, setPrefix] = React.useState('');
  const [error, setError] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (open) {
      setPrice('');
      setStock('');
      setPrefix('');
      setError(null);
    }
  }, [open]);

  const onConfirm = () => {
    setError(null);
    generate.mutate(
      {
        defaultPrice: price === '' ? undefined : Number(price),
        defaultStock: stock === '' ? undefined : Number(stock),
        skuCodePrefix: prefix || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(`${res.created?.length || 0} created, ${res.skipped} skipped`);
          onOpenChange(false);
        },
        onError: (err) => setError(err instanceof ApiError ? err.messages : ['Failed to generate']),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !generate.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate variants</DialogTitle>
          <DialogDescription>
            Creates a SKU for every combination of this product’s variation values. Existing
            combinations are skipped.
          </DialogDescription>
        </DialogHeader>

        <FormError messages={error} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gen-price">Default price</Label>
            <Input
              id="gen-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gen-stock">Default stock</Label>
            <Input
              id="gen-stock"
              type="number"
              inputMode="numeric"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gen-prefix">SKU code prefix</Label>
          <Input
            id="gen-prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="Optional — defaults to product slug"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={generate.isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={generate.isPending}>
            {generate.isPending ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
