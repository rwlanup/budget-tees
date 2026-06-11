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
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { valueSchema, type ValueInput } from '../schemas';
import { useAddValue, useUpdateValue } from '../queries';
import { valueHex, type AttributeType, type AttributeValue } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeId: string;
  attributeType: AttributeType;
  value?: AttributeValue | null;
}

const EMPTY: ValueInput = { value: '', slug: '', sortOrder: 0, hex: '' };

export function ValueFormDialog({ open, onOpenChange, attributeId, attributeType, value }: Props) {
  const isEdit = !!value;
  const isColor = attributeType === 'COLOR';
  const add = useAddValue(attributeId);
  const update = useUpdateValue(attributeId);
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<ValueInput>({
    resolver: zodResolver(valueSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(
        value
          ? {
              value: value.value,
              slug: value.slug,
              sortOrder: value.sortOrder,
              hex: valueHex(value) ?? '',
            }
          : EMPTY,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  const onSubmit = (values: ValueInput) => {
    setFormError(null);
    const body = {
      value: values.value,
      slug: values.slug || undefined,
      sortOrder: values.sortOrder,
      meta: isColor && values.hex ? { hex: values.hex } : undefined,
    };
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save value']);
    const onSuccess = () => {
      toast.success(isEdit ? 'Value updated' : 'Value added');
      onOpenChange(false);
    };
    if (isEdit && value) update.mutate({ valueId: value.id, body }, { onSuccess, onError });
    else add.mutate(body, { onSuccess, onError });
  };

  const pending = add.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit value' : 'Add value'}</DialogTitle>
          <DialogDescription>A selectable option for this attribute.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        placeholder={isColor ? 'Navy' : 'Large'}
                      />
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
                        placeholder="auto"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isColor && (
              <FormField
                control={form.control}
                name="hex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Swatch color</FormLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(field.value ?? '') ? field.value : '#000000'
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                        className="size-9 cursor-pointer rounded border bg-transparent"
                        aria-label="Pick color"
                      />
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder="#1e3a8a"
                          className="max-w-36"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {isEdit ? 'Save' : 'Add'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
