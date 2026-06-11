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
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { MediaPickerField } from '@/modules/media/components/media-picker-field';
import { ApiError } from '@/lib/api/client';
import { brandSchema, type BrandInput } from '../schemas';
import { useCreateBrand, useUpdateBrand } from '../queries';
import type { Brand } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
}

const EMPTY: BrandInput = {
  name: '',
  slug: '',
  description: '',
  logoMediaId: null,
  websiteUrl: '',
  isActive: true,
  metaTitle: '',
  metaDescription: '',
};

export function BrandFormDialog({ open, onOpenChange, brand }: Props) {
  const isEdit = !!brand;
  const create = useCreateBrand();
  const update = useUpdateBrand(brand?.id ?? '');
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open) {
      setFormError(null);
      form.reset(
        brand
          ? {
              name: brand.name,
              slug: brand.slug,
              description: brand.description ?? '',
              logoMediaId: brand.logoMediaId,
              websiteUrl: brand.websiteUrl ?? '',
              isActive: brand.isActive,
              metaTitle: brand.metaTitle ?? '',
              metaDescription: brand.metaDescription ?? '',
            }
          : EMPTY,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, brand]);

  const onSubmit = (values: BrandInput) => {
    setFormError(null);
    const body = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      logoMediaId: values.logoMediaId,
      websiteUrl: values.websiteUrl || undefined,
      isActive: values.isActive,
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
    };
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Failed to save brand']);
    const onSuccess = () => {
      toast.success(isEdit ? 'Brand updated' : 'Brand created');
      onOpenChange(false);
    };
    if (isEdit) update.mutate(body, { onSuccess, onError });
    else create.mutate(body, { onSuccess, onError });
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${brand?.name}` : 'New brand'}</DialogTitle>
          <DialogDescription>Manufacturer or label linked to products.</DialogDescription>
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
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="https://example.com"
                      inputMode="url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoMediaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <MediaPickerField
                      value={field.value}
                      onChange={field.onChange}
                      previewClassName="aspect-square w-32"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="off" />
                    </FormControl>
                    <FormDescription>SEO — optional.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta description</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="off" />
                    </FormControl>
                    <FormDescription>SEO — optional.</FormDescription>
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
                {isEdit ? 'Save' : 'Create'}
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
