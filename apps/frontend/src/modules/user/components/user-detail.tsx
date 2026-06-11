'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { BadgeCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataState } from '@/components/shared/data-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SubmitButton } from '@/components/shared/submit-button';
import { FormError } from '@/components/shared/form-error';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { useRoleOptions } from '@/modules/role/queries';
import { updateUserSchema, type UpdateUserInput } from '../schemas';
import { useDeleteUser, useUser, useUpdateUser } from '../queries';
import { USER_STATUSES, type UserStatus } from '../types';
import { UserStatusBadge } from './user-status-badge';

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
  DEACTIVATED: 'Deactivated',
};

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-64 w-full max-w-2xl" />
    </div>
  );
}

export function UserDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: user, isLoading, isError, refetch } = useUser(id);
  const { data: roles, isLoading: isRolesLoading } = useRoleOptions();
  const update = useUpdateUser(id);
  const deleteUser = useDeleteUser();

  const [formError, setFormError] = React.useState<string[] | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    values: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          roleId: user.roleId,
        }
      : undefined,
    mode: 'onTouched',
  });

  const onSubmit = (values: UpdateUserInput) => {
    setFormError(null);
    update.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        status: values.status as UserStatus,
        roleId: values.roleId,
      },
      {
        onSuccess: () => toast.success('User updated'),
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.messages : ['Failed to update user']),
      },
    );
  };

  const confirmDelete = () => {
    if (!user) return;
    setDeleteError(null);
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success('User anonymized and deactivated');
        router.replace('/admin/users');
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete user'),
    });
  };

  return (
    <DataState
      isLoading={isLoading || isRolesLoading}
      isError={isError}
      onRetry={refetch}
      loadingFallback={<DetailSkeleton />}
    >
      {user && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <UserStatusBadge status={user.status} />
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {user.email}
                    {user.emailVerifiedAt && (
                      <BadgeCheck className="size-4 text-success" aria-label="Verified" />
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Joined</p>
                  <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2" noValidate>
                  <FormError messages={formError} />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="roleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(roles ?? []).map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {USER_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

          <Card className="max-w-2xl border-destructive/40">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger zone</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Permanently anonymize this user. Order history is preserved; the action cannot be
                undone.
              </p>
              <Button
                variant="outline"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete user
              </Button>
            </CardContent>
          </Card>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={(o) => !o && setConfirmOpen(false)}
            title={`Delete ${user.firstName} ${user.lastName}?`}
            description="This permanently anonymizes the user's personal data and deactivates the account. Order history is preserved. This cannot be undone."
            confirmLabel="Delete & anonymize"
            destructive
            loading={deleteUser.isPending}
            errorMessage={deleteError}
            onConfirm={confirmDelete}
          />
        </div>
      )}
    </DataState>
  );
}
