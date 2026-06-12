'use client';

import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePublicBrands } from '@/modules/brand/queries';
import { useAttributes } from '@/modules/attribute/queries';
import type { useCatalogParams } from '@/modules/catalog/use-catalog-params';

type CatalogParams = ReturnType<typeof useCatalogParams>;

/** Filter controls bound to URL params. Backend supports brand, attribute-value, price, in-stock. */
export function CatalogFilters({ ctl }: { ctl: CatalogParams }) {
  const { params, setParam, toggleArrayParam } = ctl;
  const { data: brands } = usePublicBrands();
  const { data: attributes } = useAttributes();
  const facets = (attributes ?? []).filter((a) => a.isFilterable && a.values.length > 0);

  const [min, setMin] = React.useState(params.priceMin?.toString() ?? '');
  const [max, setMax] = React.useState(params.priceMax?.toString() ?? '');
  React.useEffect(() => setMin(params.priceMin?.toString() ?? ''), [params.priceMin]);
  React.useEffect(() => setMax(params.priceMax?.toString() ?? ''), [params.priceMax]);

  const applyPrice = () => {
    setParam('priceMin', min === '' ? null : Number(min));
    setParam('priceMax', max === '' ? null : Number(max));
  };

  const sections = ['availability', 'price'];
  if (brands?.length) sections.push('brand');
  facets.forEach((f) => sections.push(`attr-${f.id}`));

  return (
    <Accordion
      type="multiple"
      defaultValue={sections}
      className="w-full lg:rounded-xl lg:border lg:border-border lg:bg-card lg:px-4 lg:shadow-xs"
    >
      <AccordionItem value="availability">
        <AccordionTrigger className="font-heading">Availability</AccordionTrigger>
        <AccordionContent>
          <FilterRow
            checked={!!params.inStock}
            onCheckedChange={(v) => setParam('inStock', v ? '1' : null)}
            label="In stock only"
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price">
        <AccordionTrigger className="font-heading">Price</AccordionTrigger>
        <AccordionContent>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="f-min" className="text-xs text-muted-foreground">
                Min
              </Label>
              <Input
                id="f-min"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="f-max" className="text-xs text-muted-foreground">
                Max
              </Label>
              <Input
                id="f-max"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="∞"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
            <Button type="button" variant="secondary" onClick={applyPrice}>
              Go
            </Button>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">Based on list price (before sale).</p>
        </AccordionContent>
      </AccordionItem>

      {!!brands?.length && (
        <AccordionItem value="brand">
          <AccordionTrigger className="font-heading">Brand</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-0.5">
              {brands.map((b) => (
                <FilterRow
                  key={b.id}
                  checked={params.brandId === b.id}
                  onCheckedChange={(v) => setParam('brandId', v ? b.id : null)}
                  label={b.name}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {facets.map((attr) => (
        <AccordionItem key={attr.id} value={`attr-${attr.id}`}>
          <AccordionTrigger className="font-heading">{attr.name}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-0.5">
              {attr.values.map((val) => (
                <FilterRow
                  key={val.id}
                  checked={(params.attributeValueIds ?? []).includes(val.id)}
                  onCheckedChange={() => toggleArrayParam('attributeValueIds', val.id)}
                  label={val.value}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** Single checkbox filter row — full-width tap target with hover highlight + brand-active label. */
function FilterRow({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
      <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(!!v)} />
      <span
        className={cn(
          'text-sm transition-colors',
          checked ? 'font-medium text-brand' : 'text-foreground',
        )}
      >
        {label}
      </span>
    </label>
  );
}
