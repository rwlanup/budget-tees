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
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { useMe } from '@/modules/auth/queries';
import { useUpdateProfile } from '@/modules/account/queries';
import { profileSchema, type ProfileInput } from '@/modules/account/schemas';
import { DeactivateAccountCard } from './deactivate-account-card';

export function ProfilePage() {
  const { data: user } = useMe();
  const update = useUpdateProfile();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: user ? { firstName: user.firstName, lastName: user.lastName } : undefined,
    mode: 'onTouched',
  });

  const onSubmit = (values: ProfileInput) => {
    setFormError(null);
    update.mutate(values, {
      onSuccess: () => toast.success('Profile updated'),
      onError: (err) => setFormError(err instanceof ApiError ? err.messages : ['Update failed']),
    });
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-lg p-6">
        <div>
          <h2 className="font-heading text-lg font-semibold">Profile</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Update the name shown on your orders.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
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
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled readOnly />
              <p className="text-xs text-muted-foreground">Email can’t be changed here.</p>
            </div>
            <SubmitButton pending={update.isPending} pendingText="Saving…">
              Save changes
            </SubmitButton>
          </form>
        </Form>
      </Card>
      <DeactivateAccountCard />
    </div>
  );
}
