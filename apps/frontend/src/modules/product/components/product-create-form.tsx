'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormItem, FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { MultiSelectField } from '@/components/shared/multi-select-field';
import { ApiError } from '@/lib/api/client';
import { useAllTags } from '@/modules/tag/queries';
import { createProductSchema, type CreateProductInput } from '../schemas';
import type { ProductType } from '../types';
import { useCreateProduct } from '../queries';
import { ProductCoreFields } from './product-core-fields';

export function ProductCreateForm() {
  const router = useRouter();
  const create = useCreateProduct();
  const { data: tags } = useAllTags();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      categoryId: '',
      brandId: null,
      taxClassId: null,
      type: 'SIMPLE',
      tagIds: [],
      metaTitle: '',
      metaDescription: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = (values: CreateProductInput) => {
    setFormError(null);
    create.mutate(
      {
        name: values.name,
        slug: values.slug || undefined,
        shortDescription: values.shortDescription || undefined,
        description: values.description || undefined,
        categoryId: values.categoryId,
        brandId: values.brandId,
        taxClassId: values.taxClassId,
        type: values.type as ProductType,
        tagIds: values.tagIds,
        metaTitle: values.metaTitle || undefined,
        metaDescription: values.metaDescription || undefined,
      },
      {
        onSuccess: (p) => {
          toast.success('Product created');
          router.replace(`/admin/products/${p.id}`);
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to create product']),
      },
    );
  };

  const tagOptions = (tags ?? []).map((t) => ({ value: t.id, label: t.name }));

  return (
    <Card className="max-w-3xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormError messages={formError} />
            <ProductCoreFields control={form.control} />

            <FormItem>
              <FormLabel>Tags</FormLabel>
              <MultiSelectField
                options={tagOptions}
                value={form.watch('tagIds')}
                onChange={(v) => form.setValue('tagIds', v)}
                placeholder="Add tags"
                emptyText="No tags"
              />
            </FormItem>

            <div className="flex items-center gap-3">
              <SubmitButton pending={create.isPending} pendingText="Creating…">
                Create product
              </SubmitButton>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              After creating, add media, attributes, and variants on the product page.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
