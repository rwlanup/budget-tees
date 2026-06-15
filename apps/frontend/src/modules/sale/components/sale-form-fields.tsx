'use client';

import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { MultiSelectField, type MultiSelectOption } from '@/components/shared/multi-select-field';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { numericFieldProps } from '@/lib/form-utils';
import { useProductOptions } from '@/modules/product/queries';
import { useCategoryTree } from '@/modules/category/queries';
import { flattenTree } from '@/modules/category/types';
import type { SaleScope, SaleType } from '../types';

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

/** Discount value (label/step driven by sale type). Shared by create + edit. */
export function SaleValueField<T extends FieldValues>({
  control,
  saleType,
}: {
  control: Control<T>;
  saleType: SaleType;
}) {
  return (
    <FormField
      control={control}
      name={'value' as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{saleType === 'PERCENTAGE' ? 'Percent off' : 'Amount off'}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              step={saleType === 'PERCENTAGE' ? 1 : 0.01}
              {...numericFieldProps(field)}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Max discount cap (nullable). Optional helper `description` (create shows "For %"). */
export function SaleMaxCapField<T extends FieldValues>({
  control,
  description,
}: {
  control: Control<T>;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={'maxDiscountAmount' as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Max cap</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="None"
              {...numericFieldProps(field, { nullable: true })}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SaleScheduleFields<T extends FieldValues>({ control }: { control: Control<T> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name={'startsAt' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Starts</FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={'endsAt' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ends</FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function SaleActiveToggle<T extends FieldValues>({ control }: { control: Control<T> }) {
  return (
    <FormField
      control={control}
      name={'isActive' as Path<T>}
      render={({ field }) => (
        <FormItem className="flex items-center gap-3 space-y-0">
          <FormControl>
            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="!mt-0">Active</FormLabel>
        </FormItem>
      )}
    />
  );
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
