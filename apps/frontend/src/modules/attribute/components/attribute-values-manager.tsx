'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { useDeleteValue } from '../queries';
import { valueHex, type Attribute, type AttributeValue } from '../types';
import { ValueFormDialog } from './value-form-dialog';

export function AttributeValuesManager({ attribute }: { attribute: Attribute }) {
  const deleteValue = useDeleteValue(attribute.id);
  const isColor = attribute.type === 'COLOR';

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AttributeValue | null>(null);
  const [target, setTarget] = React.useState<AttributeValue | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const values = React.useMemo(
    () =>
      [...attribute.values].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.value.localeCompare(b.value),
      ),
    [attribute.values],
  );

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteValue.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Value "${target.value}" deleted`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete value'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Values</h2>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          Add value
        </Button>
      </div>

      {values.length === 0 ? (
        <EmptyState
          title="No values"
          description="Add the selectable options for this attribute."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {isColor && <TableHead className="w-16">Swatch</TableHead>}
                <TableHead>Value</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="w-20">Sort</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {values.map((v) => (
                <TableRow key={v.id}>
                  {isColor && (
                    <TableCell>
                      <span
                        className="inline-block size-6 rounded-full border"
                        style={{ backgroundColor: valueHex(v) ?? 'transparent' }}
                        aria-hidden
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{v.value}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <code className="text-xs text-muted-foreground">{v.slug}</code>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {v.sortOrder}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${v.value}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(v);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" aria-hidden />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteError(null);
                            setTarget(v);
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ValueFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        attributeId={attribute.id}
        attributeType={attribute.type}
        value={editing}
      />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Delete value "${target?.value}"?`}
        description="Deletion fails if the value is used by a product or SKU."
        confirmLabel="Delete value"
        destructive
        loading={deleteValue.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
