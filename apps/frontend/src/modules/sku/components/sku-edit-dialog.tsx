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
import { MediaPickerField } from '@/modules/media/components/media-picker-field';
import { ApiError } from '@/lib/api/client';
import { updateSkuSchema, type UpdateSkuInput } from '../schemas';
import { useUpdateSku } from '../queries';
import type { Sku } from '../types';
import { SkuNameField, SkuPriceFields } from './sku-form-fields';
import { numericFieldProps } from '@/lib/form-utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  sku: Sku | null;
}

export function SkuEditDialog({ open, onOpenChange, productId, sku }: Props) {
  const update = useUpdateSku(productId);
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<UpdateSkuInput>({
    resolver: zodResolver(updateSkuSchema),
    values: sku
      ? {
          name: sku.name ?? '',
          sku: sku.sku,
          barcode: sku.barcode ?? '',
          price: sku.price,
          compareAtPrice: sku.compareAtPrice,
          costPrice: sku.costPrice,
          lowStockThreshold: sku.lowStockThreshold,
          allowBackorder: sku.allowBackorder,
          weightGrams: sku.weightGrams,
          imageMediaId: sku.imageMediaId,
          isActive: sku.isActive,
          isDefault: sku.isDefault,
        }
      : undefined,
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open) setFormError(null);
  }, [open]);

  const onSubmit = (values: UpdateSkuInput) => {
    if (!sku) return;
    setFormError(null);
    update.mutate(
      {
        id: sku.id,
        body: {
          name: values.name || undefined,
          sku: values.sku,
          barcode: values.barcode || undefined,
          price: values.price,
          compareAtPrice: values.compareAtPrice,
          costPrice: values.costPrice,
          lowStockThreshold: values.lowStockThreshold,
          allowBackorder: values.allowBackorder,
          weightGrams: values.weightGrams,
          imageMediaId: values.imageMediaId,
          isActive: values.isActive,
          isDefault: values.isDefault,
        },
      },
      {
        onSuccess: () => {
          toast.success('Variant updated');
          onOpenChange(false);
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to update variant']),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !update.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit variant</DialogTitle>
          <DialogDescription>
            Stock is changed via Adjust stock. Combination is fixed after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            <SkuNameField control={form.control} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU code</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SkuPriceFields control={form.control} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low-stock at</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...numericFieldProps(field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weightGrams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="None"
                        {...numericFieldProps(field, { nullable: true })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageMediaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant image</FormLabel>
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

            <div className="flex flex-wrap items-center gap-8">
              <FormField
                control={form.control}
                name="allowBackorder"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Allow backorder</FormLabel>
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
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Default variant</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={update.isPending}
              >
                Cancel
              </Button>
              <SubmitButton pending={update.isPending} pendingText="Saving…">
                Save
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
