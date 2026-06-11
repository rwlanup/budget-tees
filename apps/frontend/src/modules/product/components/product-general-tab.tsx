'use client';

import * as React from 'react';
import type { Control } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { MultiSelectField } from '@/components/shared/multi-select-field';
import { ApiError } from '@/lib/api/client';
import { useAllTags } from '@/modules/tag/queries';
import { updateProductSchema, type CreateProductInput, type UpdateProductInput } from '../schemas';
import { useSetStatus, useSetTags, useUpdateProduct } from '../queries';
import { PRODUCT_STATUSES, type Product, type ProductStatus, type ProductType } from '../types';
import { ProductCoreFields } from './product-core-fields';
import { ProductStatusBadge } from './product-status-badge';

function StatusControl({ product }: { product: Product }) {
  const setStatus = useSetStatus(product.id);
  const [error, setError] = React.useState<string | null>(null);

  const change = (status: ProductStatus) => {
    setError(null);
    setStatus.mutate(status, {
      onSuccess: () => toast.success(`Status set to ${status.toLowerCase()}`),
      onError: (err) =>
        setError(err instanceof ApiError ? err.messages[0] : 'Failed to change status'),
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg">Status</CardTitle>
          <ProductStatusBadge status={product.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_STATUSES.filter((s) => s !== product.status).map((s) => (
            <Button
              key={s}
              variant={s === 'PUBLISHED' ? 'default' : 'outline'}
              size="sm"
              disabled={setStatus.isPending}
              onClick={() => change(s)}
            >
              {s === 'PUBLISHED' ? 'Publish' : s === 'DRAFT' ? 'Set draft' : 'Archive'}
            </Button>
          ))}
        </div>
      </CardHeader>
      {error && (
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Couldn’t publish</AlertTitle>
            <AlertDescription>
              {error} Add at least one active variant (SKU) in the Variants section first.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}

function TagsCard({ product }: { product: Product }) {
  const { data: tags } = useAllTags();
  const setTags = useSetTags(product.id);
  const [value, setValue] = React.useState<string[]>(product.tags.map((t) => t.id));

  React.useEffect(() => setValue(product.tags.map((t) => t.id)), [product.tags]);

  const dirty =
    value.length !== product.tags.length ||
    value.some((id) => !product.tags.find((t) => t.id === id));

  const options = (tags ?? []).map((t) => ({ value: t.id, label: t.name }));

  const save = () =>
    setTags.mutate(value, {
      onSuccess: () => toast.success('Tags updated'),
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update tags'),
    });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-lg">Tags</CardTitle>
        <Button size="sm" onClick={save} disabled={!dirty || setTags.isPending}>
          {setTags.isPending ? 'Saving…' : 'Save tags'}
        </Button>
      </CardHeader>
      <CardContent>
        <MultiSelectField
          options={options}
          value={value}
          onChange={setValue}
          placeholder="Add tags"
          emptyText="No tags"
        />
      </CardContent>
    </Card>
  );
}

function CoreForm({ product }: { product: Product }) {
  const update = useUpdateProduct(product.id);
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
    values: {
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId,
      brandId: product.brandId,
      taxClassId: product.taxClassId,
      type: product.type,
      metaTitle: product.metaTitle ?? '',
      metaDescription: product.metaDescription ?? '',
    },
    mode: 'onTouched',
  });

  const onSubmit = (values: UpdateProductInput) => {
    setFormError(null);
    update.mutate(
      {
        name: values.name,
        slug: values.slug || undefined,
        shortDescription: values.shortDescription || undefined,
        description: values.description || undefined,
        categoryId: values.categoryId,
        brandId: values.brandId,
        taxClassId: values.taxClassId,
        type: values.type as ProductType,
        metaTitle: values.metaTitle || undefined,
        metaDescription: values.metaDescription || undefined,
      },
      {
        onSuccess: () => toast.success('Product updated'),
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to update product']),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormError messages={formError} />
            <ProductCoreFields control={form.control as unknown as Control<CreateProductInput>} />
            <SubmitButton
              pending={update.isPending}
              pendingText="Saving…"
              disabled={!form.formState.isDirty}
            >
              Save changes
            </SubmitButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export function ProductGeneralTab({ product }: { product: Product }) {
  return (
    <div className="space-y-6">
      <StatusControl product={product} />
      <CoreForm product={product} />
      <TagsCard product={product} />
    </div>
  );
}
