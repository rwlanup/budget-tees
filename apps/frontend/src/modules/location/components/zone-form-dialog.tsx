'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { usePublicShippingCountries } from '@/modules/settings/queries';
import { zoneSchema, type ZoneInput } from '../schemas';
import { useCreateZone, useUpdateZone } from '../queries';
import type { ZoneBody } from '../api';
import type { ShippingZone } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: ShippingZone | null;
}

const EMPTY: ZoneInput = {
  name: '',
  countryCode: '',
  isCountryWide: false,
  regions: '',
  flatRate: 0,
  freeShippingThreshold: null,
  isActive: true,
  sortOrder: 0,
};

export function ZoneFormDialog({ open, onOpenChange, zone }: Props) {
  const isEdit = !!zone;
  const { data: countries } = usePublicShippingCountries();
  const create = useCreateZone();
  const update = useUpdateZone();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<ZoneInput>({
    resolver: zodResolver(zoneSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });
  const countryWide = form.watch('isCountryWide');

  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(
        zone
          ? {
              name: zone.name,
              countryCode: zone.countryCode,
              isCountryWide: zone.isCountryWide,
              regions: zone.regions.map((r) => r.region).join('\n'),
              flatRate: zone.flatRate,
              freeShippingThreshold: zone.freeShippingThreshold,
              isActive: zone.isActive,
              sortOrder: zone.sortOrder,
            }
          : EMPTY,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, zone]);

  const onSubmit = (values: ZoneInput) => {
    setFormError(null);
    const regions = values.isCountryWide
      ? []
      : (values.regions ?? '')
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean);

    const body: ZoneBody = {
      name: values.name,
      countryCode: values.countryCode.toUpperCase(),
      isCountryWide: values.isCountryWide,
      regions,
      flatRate: values.flatRate,
      freeShippingThreshold: values.freeShippingThreshold,
      isActive: values.isActive,
      sortOrder: values.sortOrder,
    };

    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save zone']);

    if (isEdit && zone) {
      update.mutate(
        { id: zone.id, body },
        {
          onSuccess: () => {
            toast.success('Zone updated');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(body, {
        onSuccess: () => {
          toast.success('Zone created');
          onOpenChange(false);
        },
        onError,
      });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${zone?.name}` : 'New shipping zone'}</DialogTitle>
          <DialogDescription>
            Flat delivery rate for a country (or specific regions), with optional free-shipping
            threshold.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            <FormField
              control={form.control}
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
              control={form.control}
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
                      {(countries ?? []).map((c) => (
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
              control={form.control}
              name="isCountryWide"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="!mt-0">Country-wide</FormLabel>
                    <FormDescription>
                      Applies to the whole country (no region list).
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!countryWide && (
              <FormField
                control={form.control}
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
                control={form.control}
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
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={String(field.value ?? 0)}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={
                          field.value === null || field.value === undefined
                            ? ''
                            : String(field.value)
                        }
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>Empty = no free shipping.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={String(field.value ?? 0)}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
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

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <SubmitButton pending={pending} pendingText="Saving…">
                {isEdit ? 'Save' : 'Create'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
