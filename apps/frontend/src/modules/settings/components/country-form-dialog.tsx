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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { createCountrySchema, type CreateCountryInput } from '../schemas';
import { useCreateCountry, useUpdateCountry } from '../queries';
import type { ShippingCountry } from '../types';

interface CountryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present → edit mode (code immutable). Absent → create. */
  country?: ShippingCountry | null;
}

export function CountryFormDialog({ open, onOpenChange, country }: CountryFormDialogProps) {
  const isEdit = !!country;
  const create = useCreateCountry();
  const update = useUpdateCountry();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateCountryInput>({
    resolver: zodResolver(createCountrySchema),
    defaultValues: { code: '', name: '', isActive: true, sortOrder: 0 },
    mode: 'onTouched',
  });

  // Seed values when opening (or switching target).
  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(
        country
          ? {
              code: country.code,
              name: country.name,
              isActive: country.isActive,
              sortOrder: country.sortOrder,
            }
          : { code: '', name: '', isActive: true, sortOrder: 0 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, country]);

  const onSubmit = (values: CreateCountryInput) => {
    setFormError(null);
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save country']);

    if (isEdit && country) {
      update.mutate(
        {
          code: country.code,
          body: { name: values.name, isActive: values.isActive, sortOrder: values.sortOrder },
        },
        {
          onSuccess: () => {
            toast.success('Country updated');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { ...values, code: values.code.toUpperCase() },
        {
          onSuccess: () => {
            toast.success('Country added');
            onOpenChange(false);
          },
          onError,
        },
      );
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${country?.name}` : 'Add shipping country'}</DialogTitle>
          <DialogDescription>
            Countries the store will ship to. Checkout only accepts active destinations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={2}
                      disabled={isEdit}
                      placeholder="NP"
                      className="max-w-24 uppercase"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    ISO 3166-1 alpha-2. {isEdit && 'Cannot be changed.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nepal" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-6">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="max-w-28"
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
                {isEdit ? 'Save' : 'Add country'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
