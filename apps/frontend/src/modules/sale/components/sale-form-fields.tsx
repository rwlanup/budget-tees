'use client';

import { MultiSelectField, type MultiSelectOption } from '@/components/shared/multi-select-field';
import { FormItem, FormLabel } from '@/components/ui/form';
import { useProductOptions } from '@/modules/product/queries';
import { useCategoryTree } from '@/modules/category/queries';
import { flattenTree } from '@/modules/category/types';
import type { SaleScope } from '../types';

/** ISO datetime → value for <input type="datetime-local"> (local time). */
export function isoToLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(local: string): string {
  return local ? new Date(local).toISOString() : '';
}

/** Scope-dependent target pickers (products / categories / exclusions). */
export function ScopeTargets({
  scope,
  productIds,
  categoryIds,
  excludedProductIds,
  onProducts,
  onCategories,
  onExcluded,
}: {
  scope: SaleScope;
  productIds: string[];
  categoryIds: string[];
  excludedProductIds: string[];
  onProducts: (v: string[]) => void;
  onCategories: (v: string[]) => void;
  onExcluded: (v: string[]) => void;
}) {
  const { data: products } = useProductOptions();
  const { data: tree } = useCategoryTree();

  const productOpts: MultiSelectOption[] = (products ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const categoryOpts: MultiSelectOption[] = flattenTree(tree ?? []).map(({ category, depth }) => ({
    value: category.id,
    label: `${'— '.repeat(depth)}${category.name}`,
  }));

  return (
    <div className="space-y-4">
      {scope === 'PRODUCTS' && (
        <FormItem>
          <FormLabel>Products</FormLabel>
          <MultiSelectField
            options={productOpts}
            value={productIds}
            onChange={onProducts}
            placeholder="Select products"
            emptyText="No products (first 100 shown)"
          />
        </FormItem>
      )}
      {scope === 'CATEGORIES' && (
        <FormItem>
          <FormLabel>Categories</FormLabel>
          <MultiSelectField
            options={categoryOpts}
            value={categoryIds}
            onChange={onCategories}
            placeholder="Select categories"
            emptyText="No categories"
          />
        </FormItem>
      )}
      {(scope === 'CATEGORIES' || scope === 'STORE_WIDE') && (
        <FormItem>
          <FormLabel>Excluded products</FormLabel>
          <MultiSelectField
            options={productOpts}
            value={excludedProductIds}
            onChange={onExcluded}
            placeholder="Optional exclusions"
            emptyText="No products (first 100 shown)"
          />
        </FormItem>
      )}
    </div>
  );
}
