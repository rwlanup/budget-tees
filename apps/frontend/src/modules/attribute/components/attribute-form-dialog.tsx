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
import { ApiError } from '@/lib/api/client';
import { createAttributeSchema, type CreateAttributeInput } from '../schemas';
import { useCreateAttribute, useUpdateAttribute } from '../queries';
import { isVariationType, type Attribute, type AttributeType } from '../types';
import { AttributeFormFields } from './attribute-form-fields';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute?: Attribute | null;
}

const EMPTY: CreateAttributeInput = {
  name: '',
  slug: '',
  type: 'SELECT',
  isVariation: false,
  isFilterable: true,
  sortOrder: 0,
};

export function AttributeFormDialog({ open, onOpenChange, attribute }: Props) {
  const isEdit = !!attribute;
  const create = useCreateAttribute();
  const update = useUpdateAttribute(attribute?.id ?? '');
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateAttributeInput>({
    resolver: zodResolver(createAttributeSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  const type = form.watch('type') as AttributeType;
  const canVary = isVariationType(type);

  // Force isVariation off when the type can't be a variation axis.
  React.useEffect(() => {
    if (!canVary && form.getValues('isVariation')) form.setValue('isVariation', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canVary]);

  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(
        attribute
          ? {
              name: attribute.name,
              slug: attribute.slug,
              type: attribute.type,
              isVariation: attribute.isVariation,
              isFilterable: attribute.isFilterable,
              sortOrder: attribute.sortOrder,
            }
          : EMPTY,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attribute]);

  const onSubmit = (values: CreateAttributeInput) => {
    setFormError(null);
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save attribute']);

    if (isEdit) {
      update.mutate(
        {
          name: values.name,
          slug: values.slug || undefined,
          isVariation: values.isVariation,
          isFilterable: values.isFilterable,
          sortOrder: values.sortOrder,
        },
        {
          onSuccess: () => {
            toast.success('Attribute updated');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(
        {
          name: values.name,
          slug: values.slug || undefined,
          type: values.type as AttributeType,
          isVariation: values.isVariation,
          isFilterable: values.isFilterable,
          sortOrder: values.sortOrder,
        },
        {
          onSuccess: () => {
            toast.success('Attribute created');
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
          <DialogTitle>{isEdit ? `Edit ${attribute?.name}` : 'New attribute'}</DialogTitle>
          <DialogDescription>
            Reusable attribute (e.g. Color, Size). Variation attributes drive SKU generation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            <AttributeFormFields
              control={form.control}
              isEdit={isEdit}
              attributeType={attribute?.type}
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
