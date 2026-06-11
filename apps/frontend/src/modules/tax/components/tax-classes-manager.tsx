'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Layers, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { useDeleteClass, useTaxClasses, useUpdateClass } from '../queries';
import type { TaxClass } from '../types';
import { TaxClassFormDialog } from './tax-class-form-dialog';

export function TaxClassesManager() {
  const { data, isLoading, isError, refetch } = useTaxClasses();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaxClass | null>(null);
  const [target, setTarget] = React.useState<TaxClass | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const classes = React.useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name),
      ),
    [data],
  );
  const isEmpty = !isLoading && !isError && classes.length === 0;

  const toggleActive = (c: TaxClass, isActive: boolean) =>
    updateClass.mutate(
      { id: c.id, body: { isActive } },
      {
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update class'),
      },
    );

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteClass.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Tax class "${target.name}" deleted`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete class'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          New class
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Layers}
            title="No tax classes"
            description="Create a class (e.g. Standard) to attach country rates."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                New class
              </Button>
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="w-24">Default</TableHead>
                <TableHead className="w-24">Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <code className="text-xs text-muted-foreground">{c.slug}</code>
                  </TableCell>
                  <TableCell>
                    {c.isDefault ? (
                      <Badge variant="secondary">Default</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={c.isActive}
                      onCheckedChange={(v) => toggleActive(c, v)}
                      aria-label={`${c.name} active`}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${c.name}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(c);
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
                            setTarget(c);
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
      </DataState>

      <TaxClassFormDialog open={dialogOpen} onOpenChange={setDialogOpen} taxClass={editing} />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Delete "${target?.name}"?`}
        description="Deletion fails if the class still has rates or assigned products."
        confirmLabel="Delete class"
        destructive
        loading={deleteClass.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
