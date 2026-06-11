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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { useMoveCategory } from '../queries';
import { flattenTree, subtreeIds, type Category } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  tree: Category[];
}

const ROOT = '__root__';

export function MoveCategoryDialog({ open, onOpenChange, category, tree }: Props) {
  const move = useMoveCategory();
  const [value, setValue] = React.useState<string>(ROOT);
  const [error, setError] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (open && category) {
      setError(null);
      setValue(category.parentId ?? ROOT);
    }
  }, [open, category]);

  // Valid targets: every category except the node itself and its descendants.
  const excluded = React.useMemo(() => new Set(category ? subtreeIds(category) : []), [category]);
  const options = React.useMemo(
    () => flattenTree(tree).filter((f) => !excluded.has(f.category.id)),
    [tree, excluded],
  );

  const onConfirm = () => {
    if (!category) return;
    setError(null);
    move.mutate(
      { id: category.id, newParentId: value === ROOT ? null : value },
      {
        onSuccess: () => {
          toast.success('Category moved');
          onOpenChange(false);
        },
        onError: (err) =>
          setError(err instanceof ApiError ? err.messages : ['Failed to move category']),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !move.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {category?.name}</DialogTitle>
          <DialogDescription>Choose a new parent. Its own subtree is excluded.</DialogDescription>
        </DialogHeader>

        <FormError messages={error} />

        <Select value={value} onValueChange={setValue}>
          <SelectTrigger aria-label="New parent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ROOT}>— Top level —</SelectItem>
            {options.map(({ category: c, depth }) => (
              <SelectItem key={c.id} value={c.id}>
                {`${'  '.repeat(depth)}${c.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={move.isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={move.isPending}>
            {move.isPending ? 'Moving…' : 'Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
