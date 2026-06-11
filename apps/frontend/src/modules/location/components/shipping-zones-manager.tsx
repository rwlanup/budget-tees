'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Map, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';
import { useDeleteZone, useUpdateZone, useZones } from '../queries';
import type { ShippingZone } from '../types';
import { ZoneFormDialog } from './zone-form-dialog';

export function ShippingZonesManager() {
  const { data, isLoading, isError, refetch } = useZones();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ShippingZone | null>(null);
  const [target, setTarget] = React.useState<ShippingZone | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const zones = React.useMemo(
    () =>
      [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [data],
  );
  const isEmpty = !isLoading && !isError && zones.length === 0;

  const toggleActive = (z: ShippingZone, isActive: boolean) =>
    updateZone.mutate(
      { id: z.id, body: { isActive } },
      {
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update zone'),
      },
    );

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteZone.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Zone "${target.name}" deleted`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete zone'),
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
          New zone
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Map}
            title="No shipping zones"
            description="Create a zone to charge delivery for a country or its regions."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                New zone
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
                <TableHead className="hidden sm:table-cell">Country</TableHead>
                <TableHead className="hidden md:table-cell">Scope</TableHead>
                <TableHead className="text-right">Flat rate</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Free over</TableHead>
                <TableHead className="w-24">Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((z) => (
                <TableRow key={z.id}>
                  <TableCell className="font-medium">{z.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <code className="text-sm">{z.countryCode}</code>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {z.isCountryWide ? (
                      <Badge variant="secondary">Country-wide</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {z.regions.length} region{z.regions.length === 1 ? '' : 's'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(z.flatRate)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                    {z.freeShippingThreshold != null
                      ? formatCurrency(z.freeShippingThreshold)
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={z.isActive}
                      onCheckedChange={(v) => toggleActive(z, v)}
                      aria-label={`${z.name} active`}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${z.name}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(z);
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
                            setTarget(z);
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

      <ZoneFormDialog open={dialogOpen} onOpenChange={setDialogOpen} zone={editing} />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Delete "${target?.name}"?`}
        description="Customers in this zone will no longer get a delivery quote unless another zone matches."
        confirmLabel="Delete zone"
        destructive
        loading={deleteZone.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
