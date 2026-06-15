'use client';

import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { numericFieldProps } from '@/lib/form-utils';

export function SkuNameField<T extends FieldValues>({ control }: { control: Control<T> }) {
  return (
    <FormField
      control={control}
      name={'name' as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Variant name</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value ?? ''}
              placeholder="Auto: product + selected values"
              autoComplete="off"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Price / compare-at / cost — identical across create + edit. */
export function SkuPriceFields<T extends FieldValues>({ control }: { control: Control<T> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <FormField
        control={control}
        name={'price' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input type="number" min={0} step="0.01" {...numericFieldProps(field)} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={'compareAtPrice' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Compare-at</FormLabel>
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
        name={'costPrice' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cost</FormLabel>
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
