'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Globe, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { useDeleteCountry, useShippingCountries, useUpdateCountry } from '../queries';
import type { ShippingCountry } from '../types';
import { CountryFormDialog } from './country-form-dialog';

export function ShippingCountriesManager() {
  const { data, isLoading, isError, refetch } = useShippingCountries();
  const updateCountry = useUpdateCountry();
  const deleteCountry = useDeleteCountry();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ShippingCountry | null>(null);
  const [target, setTarget] = React.useState<ShippingCountry | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const countries = React.useMemo(
    () =>
      [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [data],
  );
  const isEmpty = !isLoading && !isError && countries.length === 0;

  const toggleActive = (c: ShippingCountry, isActive: boolean) => {
    updateCountry.mutate(
      { code: c.code, body: { isActive } },
      {
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update country'),
      },
    );
  };

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteCountry.mutate(target.code, {
      onSuccess: () => {
        toast.success(`${target.name} removed`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to remove country'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Shipping countries</h2>
          <p className="text-sm text-muted-foreground">Destinations checkout accepts.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          Add country
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Globe}
            title="No shipping countries"
            description="Add at least one destination so customers can check out."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                Add country
              </Button>
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Sort</TableHead>
                <TableHead className="w-28">Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.map((c) => (
                <TableRow key={c.code}>
                  <TableCell>
                    <code className="text-sm font-medium">{c.code}</code>
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {c.sortOrder}
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

      <CountryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} country={editing} />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Remove ${target?.name}?`}
        description="Customers will no longer be able to ship here. This may fail if the country is referenced by existing records."
        confirmLabel="Remove"
        destructive
        loading={deleteCountry.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
