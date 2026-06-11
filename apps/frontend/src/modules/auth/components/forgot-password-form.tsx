'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/shared/submit-button';
import { EmptyState } from '@/components/shared/empty-state';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas';
import { useForgotPassword } from '../queries';

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const [sent, setSent] = React.useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: ForgotPasswordInput) => {
    // Backend always returns 200 (no account enumeration) — show confirmation regardless.
    forgot.mutate(values.email, { onSettled: () => setSent(true) });
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={MailCheck}
            title="Check your email"
            description="If an account exists for that address, we’ve sent a password reset link."
          />
          <Link
            href="/sign-in"
            className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Reset password</CardTitle>
        <CardDescription>We’ll email you a link to reset your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton className="w-full" pending={forgot.isPending} pendingText="Sending…">
              Send reset link
            </SubmitButton>
            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Back to sign in
            </Link>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
