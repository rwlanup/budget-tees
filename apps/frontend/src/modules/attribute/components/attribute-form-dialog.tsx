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
import { createAttributeSchema, type CreateAttributeInput } from '../schemas';
import { useCreateAttribute, useUpdateAttribute } from '../queries';
import { ATTRIBUTE_TYPES, isVariationType, type Attribute, type AttributeType } from '../types';

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

            <div className="grid gap-4 sm:grid-cols-2">
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
              <FormField
                control={form.control}
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
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  {isEdit ? (
                    <code className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                      {attribute?.type}
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
                control={form.control}
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
                control={form.control}
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
