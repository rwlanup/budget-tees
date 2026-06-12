'use client';

import { ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CatalogFilters } from './catalog-filters';
import type { CatalogSort } from '@/modules/catalog/types';
import type { useCatalogParams } from '@/modules/catalog/use-catalog-params';

const SORT_LABELS: Record<CatalogSort, string> = {
  newest: 'Newest',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  name: 'Name A–Z',
};

export function CatalogToolbar({
  ctl,
  total,
  isLoading,
}: {
  ctl: ReturnType<typeof useCatalogParams>;
  total: number;
  isLoading?: boolean;
}) {
  const { params, setParam } = ctl;

  return (
    <div className="glass sticky top-16 z-20 -mx-4 mb-5 flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:-mx-6 sm:px-6 lg:top-18 lg:mx-0 lg:rounded-xl lg:border lg:border-border lg:px-4 lg:py-2.5 lg:shadow-xs">
      <p className="text-sm font-medium text-muted-foreground tabular-nums">
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
            Loading…
          </span>
        ) : (
          <>
            <span className="font-semibold text-foreground">{total}</span>{' '}
            {total === 1 ? 'item' : 'items'}
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="size-4" aria-hidden />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-sm"
          >
            <SheetHeader className="border-b border-border px-5 py-4">
              <SheetTitle className="font-heading text-lg">Filters</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-5 pb-10">
              <CatalogFilters ctl={ctl} />
            </div>
          </SheetContent>
        </Sheet>

        <Select
          value={params.sort ?? 'newest'}
          onValueChange={(v) => setParam('sort', v === 'newest' ? null : v)}
        >
          <SelectTrigger className="w-40 sm:w-48" aria-label="Sort">
            <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as CatalogSort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
