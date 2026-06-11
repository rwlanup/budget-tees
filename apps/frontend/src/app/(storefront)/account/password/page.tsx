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
import { Card } from '@/components/ui/card';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { PasswordInput } from '@/components/shared/password-input';
import { ApiError } from '@/lib/api/client';
import { useChangePassword } from '@/modules/auth/queries';
import { changePasswordSchema, type ChangePasswordInput } from '@/modules/auth/schemas';

export default function PasswordPage() {
  const change = useChangePassword();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: ChangePasswordInput) => {
    setFormError(null);
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          toast.success('Password changed');
          form.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Could not change password']),
      },
    );
  };

  return (
    <Card className="max-w-lg p-6">
      <h2 className="font-heading text-lg font-semibold">Change password</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <FormError messages={formError} />
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton pending={change.isPending} pendingText="Saving…">
            Change password
          </SubmitButton>
        </form>
      </Form>
    </Card>
  );
}
