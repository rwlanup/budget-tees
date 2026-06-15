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
import { createCouponSchema, type CreateCouponInput } from '../schemas';
import { useCreateCoupon } from '../queries';
import { COUPON_APPLIES_TO, COUPON_TYPES, type CouponAppliesTo, type CouponType } from '../types';
import {
  CouponDescriptionField,
  CouponLimitFields,
  CouponMoneyFields,
  CouponScheduleFields,
  CouponTargets,
  CouponToggleFields,
  localInputToIso,
} from './coupon-form-fields';

const TYPE_LABEL: Record<CouponType, string> = {
  PERCENTAGE: 'Percentage',
  FIXED: 'Fixed amount',
  FREE_SHIPPING: 'Free shipping',
};
const SCOPE_LABEL: Record<CouponAppliesTo, string> = {
  ALL: 'Whole order',
  PRODUCTS: 'Specific products',
  CATEGORIES: 'Categories',
};

export function CouponCreateForm() {
  const router = useRouter();
  const create = useCreateCoupon();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateCouponInput>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: '',
      description: '',
      type: 'PERCENTAGE',
      value: null,
      maxDiscountAmount: null,
      minOrderAmount: null,
      appliesTo: 'ALL',
      productIds: [],
      categoryIds: [],
      firstOrderOnly: false,
      usageLimit: null,
      usageLimitPerUser: null,
      startsAt: '',
      endsAt: '',
      isActive: true,
    },
    mode: 'onTouched',
  });

  const type = form.watch('type') as CouponType;
  const appliesTo = form.watch('appliesTo') as CouponAppliesTo;
  const isFreeShipping = type === 'FREE_SHIPPING';

  const onSubmit = (values: CreateCouponInput) => {
    setFormError(null);
    create.mutate(
      {
        code: values.code,
        description: values.description || undefined,
        type: values.type as CouponType,
        value: isFreeShipping ? undefined : values.value,
        maxDiscountAmount: values.maxDiscountAmount,
        minOrderAmount: values.minOrderAmount,
        appliesTo: values.appliesTo as CouponAppliesTo,
        productIds: values.productIds,
        categoryIds: values.categoryIds,
        firstOrderOnly: values.firstOrderOnly,
        usageLimit: values.usageLimit,
        usageLimitPerUser: values.usageLimitPerUser,
        startsAt: localInputToIso(values.startsAt),
        endsAt: localInputToIso(values.endsAt),
        isActive: values.isActive,
      },
      {
        onSuccess: () => {
          toast.success('Coupon created');
          router.replace('/admin/coupons');
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to create coupon']),
      },
    );
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormError messages={formError} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="off"
                        placeholder="SAVE20"
                        className="uppercase"
                      />
                    </FormControl>
                    <FormDescription>Case-insensitive. Cannot be changed later.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        {COUPON_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CouponDescriptionField control={form.control} />

            <CouponMoneyFields
              control={form.control}
              showValue={!isFreeShipping}
              valueLabel={type === 'PERCENTAGE' ? 'Percent off' : 'Amount off'}
              valueStep={type === 'PERCENTAGE' ? 1 : 0.01}
            />

            <FormField
              control={form.control}
              name="appliesTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applies to</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUPON_APPLIES_TO.map((s) => (
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

            <CouponTargets
              appliesTo={appliesTo}
              productIds={form.watch('productIds')}
              categoryIds={form.watch('categoryIds')}
              onProducts={(v) => form.setValue('productIds', v)}
              onCategories={(v) => form.setValue('categoryIds', v)}
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

            <CouponLimitFields control={form.control} />

            <CouponScheduleFields control={form.control} />

            <CouponToggleFields control={form.control} />

            <div className="flex items-center gap-3">
              <SubmitButton pending={create.isPending} pendingText="Creating…">
                Create coupon
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
