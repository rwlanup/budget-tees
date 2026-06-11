'use client';

import { MultiSelectField, type MultiSelectOption } from '@/components/shared/multi-select-field';
import { FormItem, FormLabel } from '@/components/ui/form';
import { useProductOptions } from '@/modules/product/queries';
import { useCategoryTree } from '@/modules/category/queries';
import { flattenTree } from '@/modules/category/types';
import type { CouponAppliesTo } from '../types';

export function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(local?: string): string | undefined {
  return local ? new Date(local).toISOString() : undefined;
}

export function CouponTargets({
  appliesTo,
  productIds,
  categoryIds,
  onProducts,
  onCategories,
}: {
  appliesTo: CouponAppliesTo;
  productIds: string[];
  categoryIds: string[];
  onProducts: (v: string[]) => void;
  onCategories: (v: string[]) => void;
}) {
  const { data: products } = useProductOptions();
  const { data: tree } = useCategoryTree();

  if (appliesTo === 'ALL') return null;

  const productOpts: MultiSelectOption[] = (products ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const categoryOpts: MultiSelectOption[] = flattenTree(tree ?? []).map(({ category, depth }) => ({
    value: category.id,
    label: `${'— '.repeat(depth)}${category.name}`,
  }));

  return appliesTo === 'PRODUCTS' ? (
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
  ) : (
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
  );
}
