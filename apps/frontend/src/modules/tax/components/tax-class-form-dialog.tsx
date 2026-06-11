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
import { createClassSchema, type CreateClassInput } from '../schemas';
import { useCreateClass, useUpdateClass } from '../queries';
import type { TaxClass } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxClass?: TaxClass | null;
}

export function TaxClassFormDialog({ open, onOpenChange, taxClass }: Props) {
  const isEdit = !!taxClass;
  const create = useCreateClass();
  const update = useUpdateClass();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: '', slug: '', isDefault: false, isActive: true },
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(
        taxClass
          ? {
              name: taxClass.name,
              slug: taxClass.slug,
              isDefault: taxClass.isDefault,
              isActive: taxClass.isActive,
            }
          : { name: '', slug: '', isDefault: false, isActive: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taxClass]);

  const onSubmit = (values: CreateClassInput) => {
    setFormError(null);
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save tax class']);

    if (isEdit && taxClass) {
      update.mutate(
        {
          id: taxClass.id,
          body: { name: values.name, isDefault: values.isDefault, isActive: values.isActive },
        },
        {
          onSuccess: () => {
            toast.success('Tax class updated');
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
          isDefault: values.isDefault,
          isActive: values.isActive,
        },
        {
          onSuccess: () => {
            toast.success('Tax class created');
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
          <DialogTitle>{isEdit ? `Edit ${taxClass?.name}` : 'New tax class'}</DialogTitle>
          <DialogDescription>
            Group products by tax treatment. Country rates are assigned per class.
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
                    <Input placeholder="Standard" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEdit ? (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <code className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                  {taxClass?.slug}
                </code>
                <p className="text-xs text-muted-foreground">Slug is immutable.</p>
              </FormItem>
            ) : (
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="auto from name if empty"
                        autoComplete="off"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional. Generated from the name when left blank.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex items-center gap-8">
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Default class</FormLabel>
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
                    <FormLabel className="!mt-0">Active</FormLabel>
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
