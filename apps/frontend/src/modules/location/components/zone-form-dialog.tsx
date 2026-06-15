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
import { ZoneFormFields } from './zone-form-fields';
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

            <ZoneFormFields control={form.control} countries={countries ?? []} />

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
