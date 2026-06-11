'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Search, ShieldCheck, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { useDeleteRole, useRoles } from '../queries';
import type { Role } from '../types';

const PAGE_SIZE = 20;

export function RolesTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const urlSearch = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = React.useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 350);

  const setParams = React.useCallback(
    (next: { page?: number; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.page !== undefined) params.set('page', String(next.page));
      if (next.search !== undefined) {
        if (next.search) params.set('search', next.search);
        else params.delete('search');
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  // Push debounced search to URL and reset to page 1 on change.
  React.useEffect(() => {
    if (debouncedSearch !== urlSearch) setParams({ search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch, isFetching } = useRoles({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const deleteRole = useDeleteRole();
  const [target, setTarget] = React.useState<Role | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteRole.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Role "${target.name}" deleted`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete role'),
    });
  };

  const roles = data?.items ?? [];
  const isEmpty = !isLoading && !isError && roles.length === 0;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search roles…"
          className="pl-9"
          aria-label="Search roles"
        />
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        error={undefined}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={ShieldCheck}
            title={debouncedSearch ? 'No roles match your search' : 'No roles yet'}
            description={
              debouncedSearch ? 'Try a different term.' : 'Create your first role to get started.'
            }
            action={
              !debouncedSearch ? (
                <Button asChild>
                  <Link href="/admin/roles/new">New role</Link>
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border" data-fetching={isFetching || undefined}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="w-32">Permissions</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Link
                      href={`/admin/roles/${role.id}`}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <code className="text-sm">{role.name}</code>
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-[10px]">
                          System
                        </Badge>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">
                    {role.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="tabular-nums">
                      {role.permissions.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {formatDate(role.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${role.name}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/roles/${role.id}`}>
                            <Pencil className="size-4" aria-hidden />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          disabled={role.isSystem}
                          onSelect={() => {
                            setDeleteError(null);
                            setTarget(role);
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          {role.isSystem ? 'System role' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            onPageChange={(p) => setParams({ page: p })}
          />
        )}
      </DataState>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Delete role "${target?.name}"?`}
        description="This cannot be undone. Roles assigned to users cannot be deleted."
        confirmLabel="Delete role"
        destructive
        loading={deleteRole.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
