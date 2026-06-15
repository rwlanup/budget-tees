'use client';

import { type Control, useWatch } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { numericFieldProps } from '@/lib/form-utils';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ZoneInput } from '../schemas';

/** All shipping-zone dialog fields (presentation only). Bound to the caller's form. */
export function ZoneFormFields({
  control,
  countries,
}: {
  control: Control<ZoneInput>;
  countries: { code: string; name: string }[];
}) {
  const countryWide = useWatch({ control, name: 'isCountryWide' });

  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Nationwide" autoComplete="off" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="countryCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="isCountryWide"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 space-y-0">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div>
              <FormLabel className="!mt-0">Country-wide</FormLabel>
              <FormDescription>Applies to the whole country (no region list).</FormDescription>
            </div>
          </FormItem>
        )}
      />

      {!countryWide && (
        <FormField
          control={control}
          name="regions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regions</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="One region per line"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>One region per line (case-insensitive match).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={control}
          name="flatRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flat rate</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  {...numericFieldProps(field)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="freeShippingThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Free over</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="None"
                  {...numericFieldProps(field, { nullable: true })}
                />
              </FormControl>
              <FormDescription>Empty = no free shipping.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="sortOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" min={0} {...numericFieldProps(field)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3 space-y-0">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="!mt-0">Active</FormLabel>
          </FormItem>
        )}
      />
    </>
  );
}
