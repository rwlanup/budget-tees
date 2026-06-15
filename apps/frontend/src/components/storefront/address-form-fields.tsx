'use client';

import { type Control, useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AddressInput } from '@/modules/account/schemas';

const DEFAULT_FOR: Record<string, string> = {
  SHIPPING: 'shipping',
  BILLING: 'billing',
  BOTH: 'shipping & billing',
};

/** All address dialog fields (presentation only). Bound to the caller's form. */
export function AddressFormFields({
  control,
  countries,
}: {
  control: Control<AddressInput>;
  countries: { code: string; name: string }[];
}) {
  const type = useWatch({ control, name: 'type' });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SHIPPING">Shipping</SelectItem>
                  <SelectItem value="BILLING">Billing</SelectItem>
                  <SelectItem value="BOTH">Shipping &amp; Billing</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Home, Office…" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="recipientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipient name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  name={field.name}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email (optional)</FormLabel>
            <FormControl>
              <Input type="email" autoComplete="email" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="line1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address line 1</FormLabel>
            <FormControl>
              <Input autoComplete="address-line1" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="line2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address line 2 (optional)</FormLabel>
            <FormControl>
              <Input autoComplete="address-line2" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input autoComplete="address-level2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region / State (optional)</FormLabel>
              <FormControl>
                <Input autoComplete="address-level1" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
                      {c.name}
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
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal code (optional)</FormLabel>
              <FormControl>
                <Input autoComplete="postal-code" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="nearestLandmark"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nearest landmark (optional)</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="isDefault"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-3 space-y-0 rounded-lg border bg-elevated px-4 py-3">
            <FormLabel className="!mt-0 font-normal">
              Set as default {DEFAULT_FOR[type] ?? 'shipping'} address
            </FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}
