'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Boxes,
  MoreHorizontal,
  Pencil,
  Plus,
  ScrollText,
  Sliders,
  Star,
  Trash2,
} from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { useProductAttributes } from '@/modules/product/queries';
import type { Product } from '@/modules/product/types';
import { useDeleteSku, useProductSkus, useUpdateSku } from '../queries';
import { isLowStock, skuAvailable, type Sku } from '../types';
import { GenerateSkusDialog } from './generate-skus-dialog';
import { SkuCreateDialog, type VariationAxis } from './sku-create-dialog';
import { SkuEditDialog } from './sku-edit-dialog';
import { AdjustStockDialog } from './adjust-stock-dialog';
import { SkuMovementsDialog } from './sku-movements-dialog';

export function ProductVariantsManager({ product }: { product: Product }) {
  const { data: skus, isLoading, isError, refetch } = useProductSkus(product.id);
  const { data: assignment } = useProductAttributes(product.id);
  const update = useUpdateSku(product.id);
  const deleteSku = useDeleteSku(product.id);

  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Sku | null>(null);
  const [adjustTarget, setAdjustTarget] = React.useState<Sku | null>(null);
  const [movementsTarget, setMovementsTarget] = React.useState<Sku | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Sku | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const axes: VariationAxis[] = React.useMemo(
    () =>
      (assignment ?? [])
        .filter((a) => a.isVariation)
        .map((a) => ({
          attributeId: a.attributeId,
          name: a.name,
          values: a.values.map((v) => ({ id: v.id, value: v.value })),
        })),
    [assignment],
  );

  const list = skus ?? [];
  const isEmpty = !isLoading && !isError && list.length === 0;

  const toggleActive = (sku: Sku, isActive: boolean) =>
    update.mutate(
      { id: sku.id, body: { isActive } },
      {
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update'),
      },
    );

  const setDefault = (sku: Sku) =>
    update.mutate(
      { id: sku.id, body: { isDefault: true } },
      {
        onSuccess: () => toast.success(`${sku.sku} is now the default variant`),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to set default'),
      },
    );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    deleteSku.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Variant deleted');
        setDeleteTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete variant'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {axes.length
            ? `Variation axes: ${axes.map((a) => a.name).join(' × ')}`
            : 'No variation axes — single-variant product.'}
        </p>
        <div className="flex gap-2">
          {axes.length > 0 && (
            <Button variant="outline" onClick={() => setGenerateOpen(true)}>
              <Sliders className="size-4" aria-hidden />
              Generate
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add variant
          </Button>
        </div>
      </div>

      {product.type === 'VARIABLE' && axes.length === 0 && (
        <Alert>
          <Boxes className="size-4" aria-hidden />
          <AlertTitle>No variation axes yet</AlertTitle>
          <AlertDescription>
            Mark attributes as variation axes in the Attributes tab to auto-generate variants.
          </AlertDescription>
        </Alert>
      )}

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Boxes}
            title="No variants"
            description="Add a variant or generate them from variation axes. A product needs an active variant to publish."
            action={<Button onClick={() => setCreateOpen(true)}>Add variant</Button>}
          />
        }
      >
        <p className="text-xs text-muted-foreground">
          Deactivated variants are hidden from this list.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Stock</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="w-24">Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((sku) => (
                <TableRow key={sku.id}>
                  <TableCell>
                    {sku.name && <div className="text-sm font-medium">{sku.name}</div>}
                    <code className="text-xs text-muted-foreground">{sku.sku}</code>
                    <div className="mt-0.5 flex gap-1">
                      {sku.isDefault && (
                        <Badge variant="secondary" className="text-[10px]">
                          Default
                        </Badge>
                      )}
                      {isLowStock(sku) && (
                        <Badge
                          variant="outline"
                          className="border-warning text-[10px] text-warning-foreground"
                        >
                          Low
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(sku.price)}
                    {sku.compareAtPrice != null && sku.compareAtPrice > sku.price && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        {formatCurrency(sku.compareAtPrice)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {sku.stock}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                    {sku.reserved}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {skuAvailable(sku)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={sku.isActive}
                      disabled={update.isPending}
                      onCheckedChange={(v) => toggleActive(sku, v)}
                      aria-label={`${sku.sku} active`}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${sku.sku}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditTarget(sku)}>
                          <Pencil className="size-4" aria-hidden />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAdjustTarget(sku)}>
                          <Boxes className="size-4" aria-hidden />
                          Adjust stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setMovementsTarget(sku)}>
                          <ScrollText className="size-4" aria-hidden />
                          Movements
                        </DropdownMenuItem>
                        {!sku.isDefault && (
                          <DropdownMenuItem onSelect={() => setDefault(sku)}>
                            <Star className="size-4" aria-hidden />
                            Set as default
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteError(null);
                            setDeleteTarget(sku);
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

      <GenerateSkusDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        productId={product.id}
      />
      <SkuCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        productId={product.id}
        axes={axes}
      />
      <SkuEditDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        productId={product.id}
        sku={editTarget}
      />
      <AdjustStockDialog
        open={!!adjustTarget}
        onOpenChange={(o) => !o && setAdjustTarget(null)}
        productId={product.id}
        sku={adjustTarget}
      />
      <SkuMovementsDialog
        open={!!movementsTarget}
        onOpenChange={(o) => !o && setMovementsTarget(null)}
        sku={movementsTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete variant "${deleteTarget?.sku}"?`}
        description="Deletion fails if the variant appears in any order — deactivate it instead."
        confirmLabel="Delete variant"
        destructive
        loading={deleteSku.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
