'use client';

import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { skuAvailable } from '@/modules/sku/types';
import { useLowStockSkus } from '../queries';

export function LowStockPreview() {
  const { data, isLoading, isError, refetch } = useLowStockSkus();
  const skus = (data ?? []).slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b pb-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Inventory
          </p>
          <CardTitle className="font-heading text-lg">Low stock</CardTitle>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-brand hover:text-brand-strong">
          <Link href="/admin/skus">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <DataState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!isLoading && !isError && skus.length === 0}
          loadingFallback={<Skeleton className="h-32 w-full" />}
          emptyFallback={<EmptyState icon={PackageCheck} title="All stocked up" />}
        >
          <ul className="-mx-2 divide-y">
            {skus.map((sku) => (
              <li
                key={sku.id}
                className="group flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
              >
                <Link
                  href={`/admin/products/${sku.productId}?tab=variants`}
                  className="font-mono text-sm transition-colors group-hover:text-brand"
                >
                  {sku.sku}
                </Link>
                <Badge variant="warning" className="tabular-nums">
                  {skuAvailable(sku)} left
                </Badge>
              </li>
            ))}
          </ul>
        </DataState>
      </CardContent>
    </Card>
  );
}
