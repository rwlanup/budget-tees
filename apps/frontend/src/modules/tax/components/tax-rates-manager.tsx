'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Percent, Plus, Trash2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { usePublicShippingCountries } from '@/modules/settings/queries';
import { useDeleteRate, useTaxClasses, useTaxRates, useUpdateRate } from '../queries';
import type { TaxRate } from '../types';
import { TaxRateFormDialog } from './tax-rate-form-dialog';

const ALL = 'all';

export function TaxRatesManager() {
  const [classFilter, setClassFilter] = React.useState<string>(ALL);
  const [countryFilter, setCountryFilter] = React.useState<string>(ALL);

  const { data: classes } = useTaxClasses();
  const { data: countries } = usePublicShippingCountries();
  const { data, isLoading, isError, refetch } = useTaxRates({
    taxClassId: classFilter === ALL ? undefined : classFilter,
    countryCode: countryFilter === ALL ? undefined : countryFilter,
  });
  const updateRate = useUpdateRate();
  const deleteRate = useDeleteRate();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TaxRate | null>(null);
  const [target, setTarget] = React.useState<TaxRate | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const classNameById = React.useMemo(
    () => new Map((classes ?? []).map((c) => [c.id, c.name])),
    [classes],
  );
  const countryNameByCode = React.useMemo(
    () => new Map((countries ?? []).map((c) => [c.code, c.name])),
    [countries],
  );

  const rates = data ?? [];
  const isEmpty = !isLoading && !isError && rates.length === 0;
  const canCreate = (classes?.length ?? 0) > 0 && (countries?.length ?? 0) > 0;

  const toggleActive = (r: TaxRate, isActive: boolean) =>
    updateRate.mutate(
      { id: r.id, body: { isActive } },
      {
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update rate'),
      },
    );

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteRate.mutate(target.id, {
      onSuccess: () => {
        toast.success('Rate deleted');
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete rate'),
    });
  };

  return (
    <div className="space-y-4">
      {!canCreate && (
        <Alert>
          <Percent className="size-4" aria-hidden />
          <AlertTitle>Setup needed</AlertTitle>
          <AlertDescription>
            Add at least one tax class (Classes tab) and a{' '}
            <Link href="/admin/settings?tab=shipping" className="font-medium underline">
              shipping country
            </Link>{' '}
            before creating rates.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="sm:w-44" aria-label="Filter by class">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All classes</SelectItem>
              {(classes ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="sm:w-44" aria-label="Filter by country">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All countries</SelectItem>
              {(countries ?? []).map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          disabled={!canCreate}
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          New rate
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Percent}
            title="No tax rates"
            description="Assign a country rate to a tax class."
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="w-24 text-right">Rate</TableHead>
                <TableHead className="w-24">Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {classNameById.get(r.taxClassId) ?? (
                      <code className="text-xs">{r.taxClassId}</code>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{r.countryCode}</code>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {countryNameByCode.get(r.countryCode) ?? ''}
                    </span>
                  </TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.rate.toFixed(2)}%</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.isActive}
                      onCheckedChange={(v) => toggleActive(r, v)}
                      aria-label={`${r.name} active`}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${r.name}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(r);
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
                            setTarget(r);
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

      <TaxRateFormDialog open={dialogOpen} onOpenChange={setDialogOpen} rate={editing} />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title="Delete tax rate?"
        description="This removes the rate for this class and country."
        confirmLabel="Delete rate"
        destructive
        loading={deleteRate.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
