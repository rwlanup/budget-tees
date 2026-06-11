'use client';

import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePublicBrands } from '@/modules/brand/queries';
import { useAttributes } from '@/modules/attribute/queries';
import type { useCatalogParams } from '@/modules/catalog/use-catalog-params';

export function ActiveFilters({ ctl }: { ctl: ReturnType<typeof useCatalogParams> }) {
  const { params, setParam, toggleArrayParam, reset, hasFilters } = ctl;
  const { data: brands } = usePublicBrands();
  const { data: attributes } = useAttributes();

  if (!hasFilters) return null;

  const brandName = brands?.find((b) => b.id === params.brandId)?.name;
  const valueLabel = (id: string) => {
    for (const a of attributes ?? []) {
      const v = a.values.find((x) => x.id === id);
      if (v) return v.value;
    }
    return id.slice(0, 6);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {brandName && <Chip label={brandName} onRemove={() => setParam('brandId', null)} />}
      {(params.attributeValueIds ?? []).map((id) => (
        <Chip
          key={id}
          label={valueLabel(id)}
          onRemove={() => toggleArrayParam('attributeValueIds', id)}
        />
      ))}
      {params.priceMin != null && (
        <Chip label={`Min ${params.priceMin}`} onRemove={() => setParam('priceMin', null)} />
      )}
      {params.priceMax != null && (
        <Chip label={`Max ${params.priceMax}`} onRemove={() => setParam('priceMax', null)} />
      )}
      {params.inStock && <Chip label="In stock" onRemove={() => setParam('inStock', null)} />}

      <Button variant="ghost" size="sm" onClick={reset} className="h-7 px-2 text-xs">
        Clear all
      </Button>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="rounded-full p-0.5 hover:bg-background/60"
      >
        <X className="size-3" aria-hidden />
      </button>
    </Badge>
  );
}
