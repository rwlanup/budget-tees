'use client';

import { SlidersHorizontal } from 'lucide-react';
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
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {isLoading ? 'Loading…' : `${total} ${total === 1 ? 'item' : 'items'}`}
      </p>

      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="size-4" aria-hidden />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">
              <CatalogFilters ctl={ctl} />
            </div>
          </SheetContent>
        </Sheet>

        <Select
          value={params.sort ?? 'newest'}
          onValueChange={(v) => setParam('sort', v === 'newest' ? null : v)}
        >
          <SelectTrigger className="w-44" aria-label="Sort">
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
