'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
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
import { createSaleSchema, type CreateSaleInput } from '../schemas';
import { useCreateSale } from '../queries';
import { SALE_SCOPES, SALE_TYPES, type SaleScope, type SaleType } from '../types';
import { ScopeTargets, localInputToIso } from './sale-form-fields';

const SCOPE_LABEL: Record<SaleScope, string> = {
  PRODUCTS: 'Specific products',
  CATEGORIES: 'Categories',
  STORE_WIDE: 'Store-wide',
};

export function SaleCreateForm() {
  const router = useRouter();
  const create = useCreateSale();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateSaleInput>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      name: '',
      type: 'PERCENTAGE',
      value: 0,
      maxDiscountAmount: null,
      scope: 'PRODUCTS',
      productIds: [],
      categoryIds: [],
      excludedProductIds: [],
      startsAt: '',
      endsAt: '',
      isActive: true,
    },
    mode: 'onTouched',
  });

  const type = form.watch('type') as SaleType;
  const scope = form.watch('scope') as SaleScope;

  const onSubmit = (values: CreateSaleInput) => {
    setFormError(null);
    create.mutate(
      {
        name: values.name,
        type: values.type as SaleType,
        value: values.value,
        maxDiscountAmount: values.maxDiscountAmount,
        scope: values.scope as SaleScope,
        productIds: values.productIds,
        categoryIds: values.categoryIds,
        excludedProductIds: values.excludedProductIds,
        startsAt: localInputToIso(values.startsAt),
        endsAt: localInputToIso(values.endsAt),
        isActive: values.isActive,
      },
      {
        onSuccess: () => {
          toast.success('Sale created');
          router.replace('/admin/sales');
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to create sale']),
      },
    );
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormError messages={formError} />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" placeholder="Summer Sale" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SALE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t === 'PERCENTAGE' ? 'Percentage' : 'Fixed amount'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{type === 'PERCENTAGE' ? 'Percent off' : 'Amount off'}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={type === 'PERCENTAGE' ? 1 : 0.01}
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
              <FormField
                control={form.control}
                name="maxDiscountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max cap</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="None"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={
                          field.value === null || field.value === undefined
                            ? ''
                            : String(field.value)
                        }
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>For %</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scope</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SALE_SCOPES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SCOPE_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Scope cannot be changed after creation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ScopeTargets
              scope={scope}
              productIds={form.watch('productIds')}
              categoryIds={form.watch('categoryIds')}
              excludedProductIds={form.watch('excludedProductIds')}
              onProducts={(v) => form.setValue('productIds', v)}
              onCategories={(v) => form.setValue('categoryIds', v)}
              onExcluded={(v) => form.setValue('excludedProductIds', v)}
            />
            {form.formState.errors.productIds && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.productIds.message}
              </p>
            )}
            {form.formState.errors.categoryIds && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.categoryIds.message}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ends</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="flex items-center gap-3">
              <SubmitButton pending={create.isPending} pendingText="Creating…">
                Create sale
              </SubmitButton>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
