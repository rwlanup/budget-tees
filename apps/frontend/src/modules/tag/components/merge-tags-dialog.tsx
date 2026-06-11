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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { useAllTags, useMergeTags } from '../queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MergeTagsDialog({ open, onOpenChange }: Props) {
  const { data: tags } = useAllTags();
  const merge = useMergeTags();
  const [targetId, setTargetId] = React.useState<string>('');
  const [sources, setSources] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (open) {
      setTargetId('');
      setSources(new Set());
      setError(null);
    }
  }, [open]);

  // Picking a target clears it from the source set.
  const onTargetChange = (id: string) => {
    setTargetId(id);
    setSources((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSource = (id: string, on: boolean) =>
    setSources((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const onConfirm = () => {
    setError(null);
    merge.mutate(
      { sourceIds: [...sources], targetId },
      {
        onSuccess: () => {
          toast.success('Tags merged');
          onOpenChange(false);
        },
        onError: (err) => setError(err instanceof ApiError ? err.messages : ['Merge failed']),
      },
    );
  };

  const targetName = tags?.find((t) => t.id === targetId)?.name;
  const canMerge = !!targetId && sources.size > 0 && !merge.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !merge.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge tags</DialogTitle>
          <DialogDescription>
            Move all products from the selected tags onto one target tag, then delete the sources.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <FormError messages={error} />

        <div className="space-y-2">
          <p className="text-sm font-medium">Merge into (target)</p>
          <Select value={targetId} onValueChange={onTargetChange}>
            <SelectTrigger aria-label="Target tag">
              <SelectValue placeholder="Select target tag" />
            </SelectTrigger>
            <SelectContent>
              {(tags ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            Tags to merge {targetName ? `into “${targetName}”` : ''}
          </p>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
            {(tags ?? [])
              .filter((t) => t.id !== targetId)
              .map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-accent"
                >
                  <Checkbox
                    checked={sources.has(t.id)}
                    onCheckedChange={(v) => toggleSource(t.id, v === true)}
                  />
                  <span className="text-sm">{t.name}</span>
                </label>
              ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={merge.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={!canMerge}>
            {merge.isPending ? 'Merging…' : `Merge ${sources.size || ''}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
