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
    <div className="mb-5 flex flex-wrap items-center gap-2">
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

      <Button
        variant="ghost"
        size="sm"
        onClick={reset}
        className="h-8 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge
      variant="outline"
      className="press h-8 gap-1.5 border-brand/30 bg-brand-muted/40 py-0 pr-1 pl-3 text-foreground"
    >
      <span className="max-w-48 truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="-mr-0.5 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-brand hover:text-brand-foreground"
      >
        <X className="size-3" aria-hidden />
      </button>
    </Badge>
  );
}
