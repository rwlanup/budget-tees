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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { createTagSchema, type CreateTagInput } from '../schemas';
import { useCreateTag, useUpdateTag } from '../queries';
import type { Tag } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
}

const EMPTY: CreateTagInput = { name: '', slug: '', isActive: true };

export function TagFormDialog({ open, onOpenChange, tag }: Props) {
  const isEdit = !!tag;
  const create = useCreateTag();
  const update = useUpdateTag(tag?.id ?? '');
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateTagInput>({
    resolver: zodResolver(createTagSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(tag ? { name: tag.name, slug: tag.slug, isActive: tag.isActive } : EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tag]);

  const onSubmit = (values: CreateTagInput) => {
    setFormError(null);
    const body = { name: values.name, slug: values.slug || undefined, isActive: values.isActive };
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save tag']);
    const onSuccess = () => {
      toast.success(isEdit ? 'Tag updated' : 'Tag created');
      onOpenChange(false);
    };
    if (isEdit) update.mutate(body, { onSuccess, onError });
    else create.mutate(body, { onSuccess, onError });
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${tag?.name}` : 'New tag'}</DialogTitle>
          <DialogDescription>Flat labels for cross-cutting product grouping.</DialogDescription>
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
