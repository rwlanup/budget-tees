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
import { AddressFormFields } from './address-form-fields';
import { ApiError } from '@/lib/api/client';
import { usePublicShippingCountries } from '@/modules/settings/queries';
import { useCreateAddress, useUpdateAddress } from '@/modules/account/queries';
import { addressSchema, type AddressInput } from '@/modules/account/schemas';
import type { AddressBody } from '@/modules/account/api';
import type { UserAddress } from '@/modules/account/types';

const EMPTY: AddressInput = {
  type: 'SHIPPING',
  label: '',
  recipientName: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  countryCode: '',
  postalCode: '',
  nearestLandmark: '',
  isDefault: false,
};

function toBody(v: AddressInput): AddressBody {
  const clean = (s: string) => (s.trim() === '' ? undefined : s.trim());
  return {
    type: v.type,
    label: clean(v.label ?? ''),
    recipientName: v.recipientName,
    phone: v.phone,
    email: clean(v.email ?? ''),
    line1: v.line1,
    line2: clean(v.line2 ?? ''),
    city: v.city,
    region: clean(v.region ?? ''),
    countryCode: v.countryCode,
    postalCode: clean(v.postalCode ?? ''),
    nearestLandmark: clean(v.nearestLandmark ?? ''),
    isDefault: v.isDefault,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing address to edit; omit to create. */
  address?: UserAddress | null;
}

export function AddressForm({ open, onOpenChange, address }: Props) {
  const { data: countries } = usePublicShippingCountries();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [formError, setFormError] = React.useState<string[] | null>(null);
  const pending = create.isPending || update.isPending;

  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (!open) return;
    setFormError(null);
    if (address) {
      form.reset({
        type: address.type,
        label: address.label ?? '',
        recipientName: address.recipientName,
        phone: address.phone,
        email: address.email ?? '',
        line1: address.line1,
        line2: address.line2 ?? '',
        city: address.city,
        region: address.region ?? '',
        countryCode: address.countryCode,
        postalCode: address.postalCode ?? '',
        nearestLandmark: address.nearestLandmark ?? '',
        isDefault: address.isDefault,
      });
    } else {
      form.reset(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address]);

  const onSubmit = (values: AddressInput) => {
    setFormError(null);
    const body = toBody(values);
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Could not save address']);
    if (address) {
      update.mutate(
        { id: address.id, body },
        {
          onSuccess: () => {
            toast.success('Address updated');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(body, {
        onSuccess: () => {
          toast.success('Address added');
          onOpenChange(false);
        },
        onError,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit address' : 'Add address'}</DialogTitle>
          <DialogDescription>Used for delivery and order contact.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            <AddressFormFields control={form.control} countries={countries ?? []} />

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
                {address ? 'Save' : 'Add address'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
