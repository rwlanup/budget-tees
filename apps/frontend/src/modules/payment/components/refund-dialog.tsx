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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { numericFieldProps } from '@/lib/form-utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { refundSchema, type RefundInput } from '../schemas';
import { useRefund } from '../queries';
import type { Payment } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
}

export function RefundDialog({ open, onOpenChange, payment }: Props) {
  const refund = useRefund();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<RefundInput>({
    resolver: zodResolver(refundSchema),
    defaultValues: { amount: 0, reason: '', externalRef: '' },
    mode: 'onTouched',
  });

  React.useEffect(() => {
    if (open && payment) {
      setFormError(null);
      form.reset({ amount: payment.amount, reason: '', externalRef: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment]);

  const onSubmit = (values: RefundInput) => {
    if (!payment) return;
    setFormError(null);
    if (values.amount > payment.amount) {
      form.setError('amount', {
        message: `Cannot exceed ${formatCurrency(payment.amount, payment.currency)}`,
      });
      return;
    }
    refund.mutate(
      {
        id: payment.id,
        body: {
          amount: values.amount,
          reason: values.reason,
          externalRef: values.externalRef || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Refund recorded');
          onOpenChange(false);
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to record refund']),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !refund.isPending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record refund</DialogTitle>
          <DialogDescription>
            Manual (out-of-band) refund. Capped at the remaining refundable amount.
          </DialogDescription>
        </DialogHeader>

        {payment && (
          <p className="text-sm text-muted-foreground">
            Payment total:{' '}
            <span className="font-medium text-foreground tabular-nums">
              {formatCurrency(payment.amount, payment.currency)}
            </span>
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormError messages={formError} />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" min={0.01} step="0.01" {...numericFieldProps(field)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="externalRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External reference</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Gateway refund ID (optional)"
                    />
                  </FormControl>
                  <FormDescription>
                    If the refund was issued in the payment gateway.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={refund.isPending}
              >
                Cancel
              </Button>
              <SubmitButton pending={refund.isPending} pendingText="Recording…">
                Record refund
              </SubmitButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
