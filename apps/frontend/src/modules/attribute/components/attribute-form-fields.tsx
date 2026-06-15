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
import { Switch } from '@/components/ui/switch';
import { numericFieldProps } from '@/lib/form-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ATTRIBUTE_TYPES, isVariationType, type AttributeType } from '../types';
import type { CreateAttributeInput } from '../schemas';

/** Attribute dialog fields (presentation only). Type is read-only when editing. */
export function AttributeFormFields({
  control,
  isEdit,
  attributeType,
}: {
  control: Control<CreateAttributeInput>;
  isEdit: boolean;
  attributeType?: AttributeType;
}) {
  const type = useWatch({ control, name: 'type' }) as AttributeType;
  const canVary = isVariationType(type);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="auto from name"
                  autoComplete="off"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            {isEdit ? (
              <code className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                {attributeType}
              </code>
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ATTRIBUTE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FormDescription>
              {isEdit
                ? 'Type is immutable.'
                : 'SELECT, MULTISELECT, or COLOR can be variation axes.'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex flex-col gap-3">
        <FormField
          control={control}
          name="isVariation"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!canVary}
                />
              </FormControl>
              <div>
                <FormLabel className="!mt-0">Variation axis</FormLabel>
                {!canVary && (
                  <FormDescription>Only SELECT, MULTISELECT, COLOR can vary.</FormDescription>
                )}
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="isFilterable"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Filterable (storefront facet)</FormLabel>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="sortOrder"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sort order</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                className="max-w-28"
                {...numericFieldProps(field)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
