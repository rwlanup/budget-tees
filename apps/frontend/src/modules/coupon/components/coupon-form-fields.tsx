'use client';

import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { numericFieldProps } from '@/lib/form-utils';
import { MultiSelectField, type MultiSelectOption } from '@/components/shared/multi-select-field';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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

export function CouponDescriptionField<T extends FieldValues>({
  control,
}: {
  control: Control<T>;
}) {
  return (
    <FormField
      control={control}
      name={'description' as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ''} autoComplete="off" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** value (conditional) + max cap + min order. `valueLabel`/`valueStep` vary by coupon type. */
export function CouponMoneyFields<T extends FieldValues>({
  control,
  valueLabel,
  valueStep,
  showValue,
}: {
  control: Control<T>;
  valueLabel: string;
  valueStep: number;
  showValue: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {showValue && (
        <FormField
          control={control}
          name={'value' as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{valueLabel}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={valueStep}
                  {...numericFieldProps(field, { nullable: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
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
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={'minOrderAmount' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Min order</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="None"
                {...numericFieldProps(field, { nullable: true })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function CouponLimitFields<T extends FieldValues>({ control }: { control: Control<T> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name={'usageLimit' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total usage limit</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                placeholder="Unlimited"
                {...numericFieldProps(field, { nullable: true })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={'usageLimitPerUser' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Per-user limit</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                placeholder="Unlimited"
                {...numericFieldProps(field, { nullable: true })}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function CouponScheduleFields<T extends FieldValues>({ control }: { control: Control<T> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name={'startsAt' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Starts (optional)</FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} value={field.value ?? ''} />
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
            <FormLabel>Ends (optional)</FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export function CouponToggleFields<T extends FieldValues>({ control }: { control: Control<T> }) {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <FormField
        control={control}
        name={'firstOrderOnly' as Path<T>}
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 space-y-0">
            <FormControl>
              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="!mt-0">First order only</FormLabel>
          </FormItem>
        )}
      />
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
    </div>
  );
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
