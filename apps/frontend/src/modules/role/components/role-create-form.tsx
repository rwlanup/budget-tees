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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { createRoleSchema, type CreateRoleInput } from '../schemas';
import { useCreateRole } from '../queries';

export function RoleCreateForm() {
  const router = useRouter();
  const create = useCreateRole();
  const [formError, setFormError] = React.useState<string[] | null>(null);

  const form = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: CreateRoleInput) => {
    setFormError(null);
    create.mutate(
      { name: values.name, description: values.description || undefined },
      {
        onSuccess: (role) => {
          toast.success(`Role "${role.name}" created`);
          router.replace(`/admin/roles/${role.id}`);
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to create role']),
      },
    );
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormError messages={formError} />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="store_manager" autoComplete="off" {...field} />
                  </FormControl>
                  <FormDescription>
                    Lowercase letters, digits, or underscore. Cannot be changed later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What this role is for…"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3">
              <SubmitButton pending={create.isPending} pendingText="Creating…">
                Create role
              </SubmitButton>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              You’ll assign permissions on the next screen.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
