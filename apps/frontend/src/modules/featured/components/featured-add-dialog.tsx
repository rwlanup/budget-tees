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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { useAddFeatured } from '../queries';

/** Dialog to feature a published product. Owns its own selection state + mutation. */
export function FeaturedAddDialog({
  open,
  onOpenChange,
  addable,
  defaultSort,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addable: { id: string; name: string }[];
  defaultSort: number;
}) {
  const addFeatured = useAddFeatured();
  const [productId, setProductId] = React.useState('');
  const [sortOrder, setSortOrder] = React.useState('0');
  const [addError, setAddError] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (open) {
      setProductId('');
      setSortOrder(String(defaultSort));
      setAddError(null);
    }
  }, [open, defaultSort]);

  const submitAdd = () => {
    setAddError(null);
    if (!productId) {
      setAddError(['Select a product']);
      return;
    }
    addFeatured.mutate(
      { productId, sortOrder: Number(sortOrder) || 0 },
      {
        onSuccess: () => {
          toast.success('Product featured');
          onOpenChange(false);
        },
        onError: (err) =>
          setAddError(err instanceof ApiError ? err.messages : ['Failed to feature product']),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !addFeatured.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Feature a product</DialogTitle>
          <DialogDescription>Only published products can be featured.</DialogDescription>
        </DialogHeader>
        <FormError messages={addError} />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger aria-label="Product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {addable.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {addable.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No more published products to feature (first 100 shown).
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="feat-sort">Sort order</Label>
            <Input
              id="feat-sort"
              type="number"
              min={0}
              className="max-w-28"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={addFeatured.isPending}
          >
            Cancel
          </Button>
          <Button onClick={submitAdd} disabled={addFeatured.isPending || !productId}>
            {addFeatured.isPending ? 'Adding…' : 'Feature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
