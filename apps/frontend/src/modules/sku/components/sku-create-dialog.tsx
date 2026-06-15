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
import { Label } from '@/components/ui/label';
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
import { createSkuSchema, type CreateSkuInput } from '../schemas';
import { useCreateSku } from '../queries';
import { SkuNameField, SkuPriceFields } from './sku-form-fields';
import { numericFieldProps } from '@/lib/form-utils';

export interface VariationAxis {
  attributeId: string;
  name: string;
  values: { id: string; value: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  axes: VariationAxis[];
}

const EMPTY: CreateSkuInput = {
  attributeValueIds: [],
  name: '',
  sku: '',
  barcode: '',
  price: 0,
  compareAtPrice: null,
  costPrice: null,
  stock: 0,
  lowStockThreshold: 0,
  allowBackorder: false,
  weightGrams: null,
  imageMediaId: null,
};

export function SkuCreateDialog({ open, onOpenChange, productId, axes }: Props) {
  const create = useCreateSku(productId);
  const [combo, setCombo] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateSkuInput>({
    resolver: zodResolver(createSkuSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open) {
      setCombo({});
      setFormError(null);
      form.reset(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (values: CreateSkuInput) => {
    setFormError(null);
    if (axes.length && axes.some((a) => !combo[a.attributeId])) {
      setFormError(['Select a value for every variation axis']);
      return;
    }
    const attributeValueIds = axes.map((a) => combo[a.attributeId]).filter(Boolean);
    create.mutate(
      {
        attributeValueIds,
        name: values.name || undefined,
        sku: values.sku || undefined,
        barcode: values.barcode || undefined,
        price: values.price,
        compareAtPrice: values.compareAtPrice,
        costPrice: values.costPrice,
        stock: values.stock,
        lowStockThreshold: values.lowStockThreshold,
        allowBackorder: values.allowBackorder,
        weightGrams: values.weightGrams,
        imageMediaId: values.imageMediaId,
      },
      {
        onSuccess: () => {
          toast.success('Variant created');
          onOpenChange(false);
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to create variant']),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !create.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New variant</DialogTitle>
          <DialogDescription>
            {axes.length
              ? 'Pick a value per variation axis, then set price and stock.'
              : 'Single variant for this product.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            {axes.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {axes.map((axis) => (
                  <div key={axis.attributeId} className="space-y-2">
                    <Label>{axis.name}</Label>
                    <Select
                      value={combo[axis.attributeId] ?? ''}
                      onValueChange={(v) => setCombo((c) => ({ ...c, [axis.attributeId]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${axis.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {axis.values.map((val) => (
                          <SelectItem key={val.id} value={val.id}>
                            {val.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            <SkuNameField control={form.control} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="auto-generated"
                        autoComplete="off"
                      />
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

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial stock</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...numericFieldProps(field)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={create.isPending}
              >
                Cancel
              </Button>
              <SubmitButton pending={create.isPending} pendingText="Creating…">
                Create variant
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
