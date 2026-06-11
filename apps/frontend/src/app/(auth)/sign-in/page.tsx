'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Button } from '@/components/ui/button';
import { AuthCard } from '@/components/shared/auth-card';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { PasswordInput } from '@/components/shared/password-input';
import { ApiError } from '@/lib/api/client';
import { canAccessAdmin } from '@/lib/auth/auth-store';
import { loginSchema, type LoginInput } from '@/modules/auth/schemas';
import { useLogin, useResendVerification } from '@/modules/auth/queries';

function SignInInner() {
  const router = useRouter();
  const redirect = useSearchParams().get('redirect');
  const login = useLogin();
  const resend = useResendVerification();
  const [formError, setFormError] = React.useState<string[] | null>(null);
  const [unverified, setUnverified] = React.useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: LoginInput) => {
    setFormError(null);
    setUnverified(false);
    login.mutate(values, {
      onSuccess: (user) => {
        toast.success('Signed in');
        // Staff land in the dashboard; customers go to their requested page or account.
        const dest = redirect || (canAccessAdmin(user) ? '/admin' : '/');
        router.push(dest);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
          setUnverified(true);
          setFormError(['Your email is not verified yet.']);
        } else {
          setFormError(err instanceof ApiError ? err.messages : ['Sign in failed']);
        }
      },
    });
  };

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back."
      footer={
        <>
          New here?{' '}
          <Link href="/sign-up" className="font-medium text-foreground hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormError messages={formError} />
          {unverified && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resend.isPending}
              onClick={() =>
                resend.mutate(form.getValues('email'), {
                  onSuccess: () => toast.success('Verification email sent'),
                })
              }
            >
              Resend verification email
            </Button>
          )}
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton pending={login.isPending} pendingText="Signing in…" className="w-full">
            Sign in
          </SubmitButton>
        </form>
      </Form>
    </AuthCard>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
