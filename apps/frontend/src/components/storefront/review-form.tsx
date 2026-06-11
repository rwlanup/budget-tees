'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { StarRatingInput } from './star-rating';
import { reviewSchema, type ReviewInput } from '@/modules/review/schemas';
import { useCreateReview, useUpdateReview } from '@/modules/review/queries';
import type { MyReview } from '@/modules/review/types';

interface Props {
  productId: string;
  existing?: MyReview | null;
  onDone?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, existing, onDone, onCancel }: Props) {
  const create = useCreateReview(productId);
  const update = useUpdateReview(productId);
  const [formError, setFormError] = React.useState<string[] | null>(null);
  const pending = create.isPending || update.isPending;

  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existing?.rating ?? 0,
      title: existing?.title ?? '',
      body: existing?.body ?? '',
    },
    mode: 'onTouched',
  });

  const onSubmit = (values: ReviewInput) => {
    setFormError(null);
    const title = values.title?.trim() || undefined;
    const body = values.body?.trim() || undefined;
    const onError = (err: unknown) =>
      setFormError(err instanceof ApiError ? err.messages : ['Could not save review']);

    if (existing) {
      update.mutate(
        { id: existing.id, body: { rating: values.rating, title, body } },
        {
          onSuccess: () => {
            toast.success('Review updated');
            onDone?.();
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { productId, rating: values.rating, title, body },
        {
          onSuccess: () => {
            toast.success('Thanks for your review');
            form.reset({ rating: 0, title: '', body: '' });
            onDone?.();
          },
          onError,
        },
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError messages={formError} />

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your rating</FormLabel>
              <FormControl>
                <StarRatingInput value={field.value} onChange={field.onChange} disabled={pending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Sum it up"
                  {...field}
                  value={field.value ?? ''}
                  maxLength={120}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review (optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="What did you think of the product?"
                  {...field}
                  value={field.value ?? ''}
                  maxLength={2000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2">
          <SubmitButton pending={pending} pendingText="Saving…">
            {existing ? 'Update review' : 'Submit review'}
          </SubmitButton>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
