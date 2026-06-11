'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataState } from '@/components/shared/data-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SubmitButton } from '@/components/shared/submit-button';
import { ApiError } from '@/lib/api/client';
import { updateRoleSchema, type UpdateRoleInput } from '../schemas';
import { useDeleteRole, useRole, useUpdateRole } from '../queries';
import { PermissionMatrix } from './permission-matrix';

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full max-w-2xl" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export function RoleDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: role, isLoading, isError, refetch } = useRole(id);
  const update = useUpdateRole(id);
  const deleteRole = useDeleteRole();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const form = useForm<UpdateRoleInput>({
    resolver: zodResolver(updateRoleSchema),
    values: { description: role?.description ?? '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: UpdateRoleInput) => {
    update.mutate(
      { description: values.description || undefined },
      {
        onSuccess: () => toast.success('Role updated'),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.messages[0] : 'Failed to update role'),
      },
    );
  };

  const confirmDelete = () => {
    if (!role) return;
    setDeleteError(null);
    deleteRole.mutate(role.id, {
      onSuccess: () => {
        toast.success(`Role "${role.name}" deleted`);
        router.replace('/admin/roles');
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete role'),
    });
  };

  return (
    <DataState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      loadingFallback={<DetailSkeleton />}
    >
      {role && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold">
                <code>{role.name}</code>
              </h1>
              {role.isSystem && <Badge variant="secondary">System</Badge>}
            </div>
            {role.isSystem ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button variant="outline" disabled>
                      <Trash2 className="size-4" aria-hidden />
                      Delete
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>System roles cannot be deleted</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </Button>
            )}
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <code className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                        {role.name}
                      </code>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Name is immutable.</p>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <SubmitButton
                    pending={update.isPending}
                    pendingText="Saving…"
                    disabled={!form.formState.isDirty}
                  >
                    Save details
                  </SubmitButton>
                </form>
              </Form>
            </CardContent>
          </Card>

          <PermissionMatrix role={role} />

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={(o) => !o && setConfirmOpen(false)}
            title={`Delete role "${role.name}"?`}
            description="This cannot be undone. Roles assigned to users cannot be deleted."
            confirmLabel="Delete role"
            destructive
            loading={deleteRole.isPending}
            errorMessage={deleteError}
            onConfirm={confirmDelete}
          />
        </div>
      )}
    </DataState>
  );
}
