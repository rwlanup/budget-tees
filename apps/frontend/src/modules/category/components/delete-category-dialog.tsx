'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ApiError } from '@/lib/api/client';
import { useDeleteCategory } from '../queries';
import type { Category } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function DeleteCategoryDialog({ open, onOpenChange, category }: Props) {
  const del = useDeleteCategory();
  const [cascade, setCascade] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const childCount = category?.children?.length ?? 0;
  const hasChildren = childCount > 0;

  React.useEffect(() => {
    if (open) {
      setCascade(false);
      setError(null);
    }
  }, [open]);

  const onConfirm = () => {
    if (!category) return;
    setError(null);
    del.mutate(
      { id: category.id, cascade },
      {
        onSuccess: () => {
          toast.success(`Category "${category.name}" deleted`);
          onOpenChange(false);
        },
        onError: (err) =>
          setError(err instanceof ApiError ? err.messages[0] : 'Failed to delete category'),
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !del.isPending && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{category?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {hasChildren
              ? `This category has ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'}. Deleting requires removing the whole subtree.`
              : 'This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasChildren && (
          <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <Checkbox checked={cascade} onCheckedChange={(v) => setCascade(v === true)} />
            Also delete all {childCount} subcategor{childCount === 1 ? 'y' : 'ies'} (cascade)
          </label>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={del.isPending || (hasChildren && !cascade)}
          >
            {del.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
