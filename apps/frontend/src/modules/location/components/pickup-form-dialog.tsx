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
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { PickupFormFields } from './pickup-form-fields';
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

            <PickupFormFields control={form.control} countries={countries ?? []} />

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
