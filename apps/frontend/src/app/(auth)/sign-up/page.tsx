'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MailCheck } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthCard } from '@/components/shared/auth-card';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { PasswordInput } from '@/components/shared/password-input';
import { ApiError } from '@/lib/api/client';
import { signUpSchema, type SignUpInput } from '@/modules/auth/schemas';
import { useRegister, useResendVerification } from '@/modules/auth/queries';

export default function SignUpPage() {
  const register = useRegister();
  const resend = useResendVerification();
  const [formError, setFormError] = React.useState<string[] | null>(null);
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: SignUpInput) => {
    setFormError(null);
    register.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => setRegisteredEmail(values.email),
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Registration failed']),
      },
    );
  };

  if (registeredEmail) {
    return (
      <AuthCard
        title="Check your email"
        description={`We sent a verification link to ${registeredEmail}.`}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck className="size-10 text-success" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Verify your email, then sign in to start shopping.
          </p>
          <Button asChild className="w-full">
            <Link href="/sign-in">Go to sign in</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={resend.isPending}
            onClick={() =>
              resend.mutate(registeredEmail, {
                onSuccess: () => toast.success('Verification email resent'),
              })
            }
          >
            Resend email
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create account"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormError messages={formError} />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
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
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton pending={register.isPending} pendingText="Creating…" className="w-full">
            Create account
          </SubmitButton>
        </form>
      </Form>
    </AuthCard>
  );
}
