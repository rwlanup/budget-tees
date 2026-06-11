'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
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
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { updateCouponSchema, type UpdateCouponInput } from '../schemas';
import { useUpdateCoupon } from '../queries';
import type { Coupon } from '../types';
import type { UpdateCouponBody } from '../api';
import { CouponTargets, isoToLocalInput, localInputToIso } from './coupon-form-fields';

function nullableNum(field: {
  value: unknown;
  onChange: (v: unknown) => void;
  name: string;
  onBlur: () => void;
  ref: React.Ref<HTMLInputElement>;
}) {
  return {
    name: field.name,
    ref: field.ref,
    onBlur: field.onBlur,
    value: field.value === null || field.value === undefined ? '' : String(field.value),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      field.onChange(e.target.value === '' ? null : Number(e.target.value)),
  };
}

export function CouponEditForm({ coupon }: { coupon: Coupon }) {
  const router = useRouter();
  const update = useUpdateCoupon(coupon.id);
  const [formError, setFormError] = React.useState<string[] | null>(null);
  const isFreeShipping = coupon.type === 'FREE_SHIPPING';

  const form = useForm<UpdateCouponInput>({
    resolver: zodResolver(updateCouponSchema),
    defaultValues: {
      description: coupon.description ?? '',
      value: coupon.value,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,
      firstOrderOnly: coupon.firstOrderOnly,
      usageLimit: coupon.usageLimit,
      usageLimitPerUser: coupon.usageLimitPerUser,
      startsAt: isoToLocalInput(coupon.startsAt),
      endsAt: isoToLocalInput(coupon.endsAt),
      isActive: coupon.isActive,
      replaceTargets: false,
      productIds: [],
      categoryIds: [],
    },
    mode: 'onTouched',
  });

  const replaceTargets = form.watch('replaceTargets');

  const onSubmit = (values: UpdateCouponInput) => {
    setFormError(null);
    if (coupon.type === 'PERCENTAGE' && values.value != null && values.value > 100) {
      form.setError('value', { message: 'Percentage cannot exceed 100' });
      return;
    }
    const body: UpdateCouponBody = {
      description: values.description || undefined,
      value: isFreeShipping ? undefined : values.value,
      maxDiscountAmount: values.maxDiscountAmount,
      minOrderAmount: values.minOrderAmount,
      firstOrderOnly: values.firstOrderOnly,
      usageLimit: values.usageLimit,
      usageLimitPerUser: values.usageLimitPerUser,
      startsAt: localInputToIso(values.startsAt),
      endsAt: localInputToIso(values.endsAt),
      isActive: values.isActive,
    };
    if (values.replaceTargets) {
      if (coupon.appliesTo === 'PRODUCTS') body.productIds = values.productIds;
      if (coupon.appliesTo === 'CATEGORIES') body.categoryIds = values.categoryIds;
    }
    update.mutate(body, {
      onSuccess: () => {
        toast.success('Coupon updated');
        router.replace('/admin/coupons');
      },
      onError: (err) =>
        setFormError(err instanceof ApiError ? err.messages : ['Failed to update coupon']),
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormError messages={formError} />

            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-sm font-medium">{coupon.code}</code>
              <Badge variant="outline">{coupon.type}</Badge>
              <Badge variant="outline">{coupon.appliesTo}</Badge>
              <span className="text-xs text-muted-foreground">
                Used {coupon.usedCount}
                {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''} · code, type & scope are
                immutable
              </span>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              {!isFreeShipping && (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {coupon.type === 'PERCENTAGE' ? 'Percent off' : 'Amount off'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={coupon.type === 'PERCENTAGE' ? 1 : 0.01}
                          {...nullableNum(field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                        {...nullableNum(field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="None"
                        {...nullableNum(field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="usageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total usage limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        {...nullableNum(field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="usageLimitPerUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Per-user limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        {...nullableNum(field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value ?? ''} />
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
                    <FormLabel>Ends (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap items-center gap-8">
              <FormField
                control={form.control}
                name="firstOrderOnly"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">First order only</FormLabel>
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

            {coupon.appliesTo !== 'ALL' && (
              <>
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
                        The selection below overwrites the coupon’s existing targets on save.
                      </AlertDescription>
                    </Alert>
                    <CouponTargets
                      appliesTo={coupon.appliesTo}
                      productIds={form.watch('productIds')}
                      categoryIds={form.watch('categoryIds')}
                      onProducts={(v) => form.setValue('productIds', v)}
                      onCategories={(v) => form.setValue('categoryIds', v)}
                    />
                  </>
                )}
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
