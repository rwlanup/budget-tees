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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { updateSaleSchema, type UpdateSaleInput } from '../schemas';
import { useUpdateSale } from '../queries';
import type { Sale } from '../types';
import type { UpdateSaleBody } from '../api';
import {
  SaleActiveToggle,
  SaleMaxCapField,
  SaleScheduleFields,
  SaleValueField,
  ScopeTargets,
  isoToLocalInput,
  localInputToIso,
} from './sale-form-fields';

export function SaleEditForm({ sale }: { sale: Sale }) {
  const router = useRouter();
  const update = useUpdateSale(sale.id);
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<UpdateSaleInput>({
    resolver: zodResolver(updateSaleSchema),
    defaultValues: {
      name: sale.name,
      value: sale.value,
      maxDiscountAmount: sale.maxDiscountAmount,
      startsAt: isoToLocalInput(sale.startsAt),
      endsAt: isoToLocalInput(sale.endsAt),
      isActive: sale.isActive,
      replaceTargets: false,
      productIds: [],
      categoryIds: [],
      excludedProductIds: [],
    },
    mode: 'onTouched',
  });

  const replaceTargets = form.watch('replaceTargets');

  const onSubmit = (values: UpdateSaleInput) => {
    setFormError(null);
    if (sale.type === 'PERCENTAGE' && values.value > 100) {
      form.setError('value', { message: 'Percentage cannot exceed 100' });
      return;
    }
    const body: UpdateSaleBody = {
      name: values.name,
      value: values.value,
      maxDiscountAmount: values.maxDiscountAmount,
      startsAt: localInputToIso(values.startsAt),
      endsAt: localInputToIso(values.endsAt),
      isActive: values.isActive,
    };
    if (values.replaceTargets) {
      if (sale.scope === 'PRODUCTS') body.productIds = values.productIds;
      if (sale.scope === 'CATEGORIES') {
        body.categoryIds = values.categoryIds;
        body.excludedProductIds = values.excludedProductIds;
      }
      if (sale.scope === 'STORE_WIDE') body.excludedProductIds = values.excludedProductIds;
    }
    update.mutate(body, {
      onSuccess: () => {
        toast.success('Sale updated');
        router.replace('/admin/sales');
      },
      onError: (err) =>
        setFormError(err instanceof ApiError ? err.messages : ['Failed to update sale']),
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormError messages={formError} />

            <div className="flex gap-2">
              <Badge variant="outline">
                {sale.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed amount'}
              </Badge>
              <Badge variant="outline">{sale.scope}</Badge>
              <span className="text-xs text-muted-foreground">Type and scope are immutable.</span>
            </div>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <SaleValueField control={form.control} saleType={sale.type} />
              <SaleMaxCapField control={form.control} />
            </div>

            <SaleScheduleFields control={form.control} />

            <SaleActiveToggle control={form.control} />

            <Separator />

            <FormField
              control={form.control}
              name="replaceTargets"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="!mt-0">Replace scope targets</FormLabel>
                    <FormDescription>
                      Current targets can’t be shown; enabling replaces them entirely.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {replaceTargets && (
              <>
                <Alert>
                  <Info className="size-4" aria-hidden />
                  <AlertTitle>Replacing targets</AlertTitle>
                  <AlertDescription>
                    The selections below overwrite the sale’s existing targets on save.
                  </AlertDescription>
                </Alert>
                <ScopeTargets
                  scope={sale.scope}
                  productIds={form.watch('productIds')}
                  categoryIds={form.watch('categoryIds')}
                  excludedProductIds={form.watch('excludedProductIds')}
                  onProducts={(v) => form.setValue('productIds', v)}
                  onCategories={(v) => form.setValue('categoryIds', v)}
                  onExcluded={(v) => form.setValue('excludedProductIds', v)}
                />
              </>
            )}

            <div className="flex items-center gap-3">
              <SubmitButton pending={update.isPending} pendingText="Saving…">
                Save changes
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
