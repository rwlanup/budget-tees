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
    <Accordion type="multiple" defaultValue={sections} className="w-full">
      <AccordionItem value="availability">
        <AccordionTrigger>Availability</AccordionTrigger>
        <AccordionContent>
          <label className="flex items-center gap-2 py-1">
            <Checkbox
              checked={!!params.inStock}
              onCheckedChange={(v) => setParam('inStock', v ? '1' : null)}
            />
            <span className="text-sm">In stock only</span>
          </label>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price">
        <AccordionTrigger>Price</AccordionTrigger>
        <AccordionContent>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="f-min" className="text-xs">
                Min
              </Label>
              <Input
                id="f-min"
                type="number"
                min={0}
                inputMode="numeric"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="f-max" className="text-xs">
                Max
              </Label>
              <Input
                id="f-max"
                type="number"
                min={0}
                inputMode="numeric"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={applyPrice}>
              Go
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Based on list price (before sale).</p>
        </AccordionContent>
      </AccordionItem>

      {!!brands?.length && (
        <AccordionItem value="brand">
          <AccordionTrigger>Brand</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1">
              {brands.map((b) => (
                <label key={b.id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    checked={params.brandId === b.id}
                    onCheckedChange={(v) => setParam('brandId', v ? b.id : null)}
                  />
                  <span className="text-sm">{b.name}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {facets.map((attr) => (
        <AccordionItem key={attr.id} value={`attr-${attr.id}`}>
          <AccordionTrigger>{attr.name}</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1">
              {attr.values.map((val) => (
                <label key={val.id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    checked={(params.attributeValueIds ?? []).includes(val.id)}
                    onCheckedChange={() => toggleArrayParam('attributeValueIds', val.id)}
                  />
                  <span className="text-sm">{val.value}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
