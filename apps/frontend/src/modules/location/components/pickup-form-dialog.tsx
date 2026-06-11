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
import { pickupSchema, type PickupInput } from '../schemas';
import { useCreatePickup, useUpdatePickup } from '../queries';
import type { PickupBody } from '../api';
import type { PickupLocation } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickup?: PickupLocation | null;
}

const EMPTY: PickupInput = {
  name: '',
  phone: '',
  email: '',
  line1: '',
  city: '',
  region: '',
  countryCode: '',
  postalCode: '',
  latitude: '',
  longitude: '',
  openingHours: '',
  isActive: true,
};

export function PickupFormDialog({ open, onOpenChange, pickup }: Props) {
  const isEdit = !!pickup;
  const { data: countries } = usePublicShippingCountries();
  const create = useCreatePickup();
  const update = useUpdatePickup();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<PickupInput>({
    resolver: zodResolver(pickupSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(
        pickup
          ? {
              name: pickup.name,
              phone: pickup.phone ?? '',
              email: pickup.email ?? '',
              line1: pickup.line1,
              city: pickup.city,
              region: pickup.region ?? '',
              countryCode: pickup.countryCode,
              postalCode: pickup.postalCode ?? '',
              latitude: pickup.latitude ?? '',
              longitude: pickup.longitude ?? '',
              openingHours: pickup.openingHours ? JSON.stringify(pickup.openingHours, null, 2) : '',
              isActive: pickup.isActive,
            }
          : EMPTY,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pickup]);

  const onSubmit = (values: PickupInput) => {
    setFormError(null);

    let openingHours: Record<string, unknown> | undefined;
    if (values.openingHours && values.openingHours.trim()) {
      try {
        openingHours = JSON.parse(values.openingHours);
      } catch {
        form.setError('openingHours', { message: 'Invalid JSON' });
        return;
      }
    }

    const trim = (v?: string) => (v && v.trim() ? v.trim() : undefined);
    const body: PickupBody = {
      name: values.name,
      phone: trim(values.phone),
      email: trim(values.email),
      line1: values.line1,
      city: values.city,
      region: trim(values.region),
      countryCode: values.countryCode.toUpperCase(),
      postalCode: trim(values.postalCode),
      latitude: trim(values.latitude),
      longitude: trim(values.longitude),
      openingHours,
      isActive: values.isActive,
    };

    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save store']);

    if (isEdit && pickup) {
      update.mutate(
        { id: pickup.id, body },
        {
          onSuccess: () => {
            toast.success('Store updated');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(body, {
        onSuccess: () => {
          toast.success('Store added');
          onOpenChange(false);
        },
        onError,
      });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${pickup?.name}` : 'Add store'}</DialogTitle>
          <DialogDescription>
            The store is used for branding and as the order pickup point. Only one can be active.
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
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" inputMode="tel" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" inputMode="email" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region / State</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="27.7172" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder="85.3240" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="openingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening hours (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      spellCheck={false}
                      className="font-mono text-xs"
                      placeholder='{"mon":"9-5","sun":"closed"}'
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>Optional. Free-form JSON object.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="!mt-0">Active</FormLabel>
                    <FormDescription>Activating this store deactivates any other.</FormDescription>
                  </div>
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
                {isEdit ? 'Save' : 'Add store'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
