'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { MoreHorizontal, Plus, Star, Trash2 } from 'lucide-react';
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
import { useProducts } from '@/modules/product/queries';
import { useFeatured, useRemoveFeatured, useUpdateFeatured } from '../queries';
import type { FeaturedProduct } from '../types';
import { FeaturedAddDialog } from './featured-add-dialog';

export function FeaturedManager() {
  const { data, isLoading, isError, refetch } = useFeatured();
  const { data: products } = useProducts({ page: 1, limit: 100, status: 'PUBLISHED' });
  const updateFeatured = useUpdateFeatured();
  const removeFeatured = useRemoveFeatured();

  const [addOpen, setAddOpen] = React.useState(false);
  const [target, setTarget] = React.useState<FeaturedProduct | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const nameOf = React.useCallback(
    (pid: string) => products?.items.find((p) => p.id === pid)?.name ?? `${pid.slice(0, 8)}…`,
    [products],
  );

  const rows = React.useMemo(
    () => [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [data],
  );
  const isEmpty = !isLoading && !isError && rows.length === 0;

  // Published products not already featured.
  const featuredIds = new Set(rows.map((r) => r.productId));
  const addable = (products?.items ?? []).filter((p) => !featuredIds.has(p.id));

  const toggleActive = (row: FeaturedProduct, isActive: boolean) =>
    updateFeatured.mutate(
      { id: row.id, body: { isActive } },
      {
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update'),
      },
    );

  const bumpSort = (row: FeaturedProduct, delta: number) =>
    updateFeatured.mutate(
      { id: row.id, body: { sortOrder: Math.max(0, row.sortOrder + delta) } },
      {
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to reorder'),
      },
    );

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    removeFeatured.mutate(target.id, {
      onSuccess: () => {
        toast.success('Removed from featured');
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to remove'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Feature a product
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Star}
            title="No featured products"
            description="Feature published products to highlight them on the storefront homepage."
            action={<Button onClick={() => setAddOpen(true)}>Feature a product</Button>}
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="w-24">Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="tabular-nums text-muted-foreground">{row.sortOrder}</span>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === 0 || updateFeatured.isPending}
                          onClick={() => bumpSort(row, -1)}
                          aria-label="Move up"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === rows.length - 1 || updateFeatured.isPending}
                          onClick={() => bumpSort(row, 1)}
                          aria-label="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{nameOf(row.productId)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={row.isActive}
                      disabled={updateFeatured.isPending}
                      onCheckedChange={(v) => toggleActive(row, v)}
                      aria-label="Active"
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteError(null);
                            setTarget(row);
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Unpublished products are automatically hidden from the storefront even if listed here.
        </p>
      </DataState>

      <FeaturedAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        addable={addable}
        defaultSort={rows.length}
      />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Remove "${target ? nameOf(target.productId) : ''}"?`}
        description="Removes the product from the featured list. The product itself is unaffected."
        confirmLabel="Remove"
        destructive
        loading={removeFeatured.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
