'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Plus, Store, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useDeletePickup, usePickups, useUpdatePickup } from '../queries';
import type { PickupLocation } from '../types';
import { PickupFormDialog } from './pickup-form-dialog';

export function PickupManager() {
  const { data, isLoading, isError, refetch } = usePickups();
  const updatePickup = useUpdatePickup();
  const deletePickup = useDeletePickup();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PickupLocation | null>(null);
  const [target, setTarget] = React.useState<PickupLocation | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const stores = React.useMemo(
    () =>
      [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [data],
  );
  const isEmpty = !isLoading && !isError && stores.length === 0;

  const setActive = (s: PickupLocation) =>
    updatePickup.mutate(
      { id: s.id, body: { isActive: true } },
      {
        onSuccess: () => toast.success(`${s.name} is now the active store`),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update store'),
      },
    );

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deletePickup.mutate(target.id, {
      onSuccess: () => {
        toast.success(`${target.name} removed`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to remove store'),
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
          Add store
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Store}
            title="No store added"
            description="Add your store for branding and as the pickup point."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                Add store
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
                <TableHead className="hidden sm:table-cell">Address</TableHead>
                <TableHead className="w-28">Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {s.line1}, {s.city}
                    {s.region ? `, ${s.region}` : ''} ({s.countryCode})
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={s.isActive}
                      disabled={s.isActive || updatePickup.isPending}
                      onCheckedChange={() => setActive(s)}
                      aria-label={`Make ${s.name} active`}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${s.name}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(s);
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
                            setTarget(s);
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
        <p className="text-sm text-muted-foreground">
          Only one store can be active at a time. Activating one deactivates the others.
        </p>
      </DataState>

      <PickupFormDialog open={dialogOpen} onOpenChange={setDialogOpen} pickup={editing} />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Remove ${target?.name}?`}
        description="This removes the store location. This cannot be undone."
        confirmLabel="Remove"
        destructive
        loading={deletePickup.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
