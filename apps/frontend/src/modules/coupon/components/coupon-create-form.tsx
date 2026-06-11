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
import { createCouponSchema, type CreateCouponInput } from '../schemas';
import { useCreateCoupon } from '../queries';
import { COUPON_APPLIES_TO, COUPON_TYPES, type CouponAppliesTo, type CouponType } from '../types';
import { CouponTargets, localInputToIso } from './coupon-form-fields';

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

/** Bind an integer/decimal nullable field to an input. */
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
                      <FormLabel>{type === 'PERCENTAGE' ? 'Percent off' : 'Amount off'}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={type === 'PERCENTAGE' ? 1 : 0.01}
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
