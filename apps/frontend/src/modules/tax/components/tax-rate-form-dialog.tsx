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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { numericFieldProps } from '@/lib/form-utils';
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
import { createRateSchema, type CreateRateInput } from '../schemas';
import { useCreateRate, useUpdateRate, useTaxClasses } from '../queries';
import type { TaxRate } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate?: TaxRate | null;
}

export function TaxRateFormDialog({ open, onOpenChange, rate }: Props) {
  const isEdit = !!rate;
  const { data: classes } = useTaxClasses();
  const { data: countries } = usePublicShippingCountries();
  const create = useCreateRate();
  const update = useUpdateRate();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateRateInput>({
    resolver: zodResolver(createRateSchema),
    defaultValues: { taxClassId: '', name: '', countryCode: '', rate: 0, isActive: true },
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(
        rate
          ? {
              taxClassId: rate.taxClassId,
              name: rate.name,
              countryCode: rate.countryCode,
              rate: rate.rate,
              isActive: rate.isActive,
            }
          : { taxClassId: '', name: '', countryCode: '', rate: 0, isActive: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rate]);

  const onSubmit = (values: CreateRateInput) => {
    setFormError(null);
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save rate']);

    if (isEdit && rate) {
      update.mutate(
        { id: rate.id, body: { name: values.name, rate: values.rate, isActive: values.isActive } },
        {
          onSuccess: () => {
            toast.success('Rate updated');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { ...values, countryCode: values.countryCode.toUpperCase() },
        {
          onSuccess: () => {
            toast.success('Rate created');
            onOpenChange(false);
          },
          onError,
        },
      );
    }
  };

  const pending = create.isPending || update.isPending;
  const className = classes?.find((c) => c.id === rate?.taxClassId)?.name ?? rate?.taxClassId;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit rate' : 'New tax rate'}</DialogTitle>
          <DialogDescription>
            Rate is extracted from the inclusive price for the chosen class and country.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            {isEdit ? (
              <div className="grid grid-cols-2 gap-4 rounded-md border bg-muted/40 p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="font-medium">{className}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Country</p>
                  <p className="font-medium">{rate?.countryCode}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="taxClassId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax class</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(classes ?? []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
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
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="VAT" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-8">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (%)</FormLabel>
                    <FormControl>
                      <div className="relative max-w-32">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min={0}
                          max={100}
                          className="pr-7"
                          {...numericFieldProps(field)}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <div className="flex h-9 items-center">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
