'use client';

import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
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
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { skuAvailable } from '../types';
import { useLowStock } from '../queries';

export function LowStockReport() {
  const { data, isLoading, isError, refetch } = useLowStock();
  const list = data ?? [];
  const isEmpty = !isLoading && !isError && list.length === 0;

  return (
    <DataState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      isEmpty={isEmpty}
      emptyFallback={
        <EmptyState
          icon={PackageCheck}
          title="All stocked up"
          description="No variants are at or below their low-stock threshold."
        />
      }
    >
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product SKU</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((sku) => (
              <TableRow key={sku.id}>
                <TableCell>
                  {sku.name && <div className="text-sm font-medium">{sku.name}</div>}
                  <code className="text-xs text-muted-foreground">{sku.sku}</code>
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className="border-warning tabular-nums text-warning-foreground"
                  >
                    {skuAvailable(sku)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {sku.lowStockThreshold}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/products/${sku.productId}?tab=variants`}>Manage</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DataState>
  );
}
