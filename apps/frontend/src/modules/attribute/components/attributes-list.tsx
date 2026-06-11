'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ListChecks, MoreHorizontal, Pencil, Plus, Settings2, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { useAttributes, useDeleteAttribute } from '../queries';
import type { Attribute } from '../types';
import { AttributeFormDialog } from './attribute-form-dialog';

export function AttributesList() {
  const { data, isLoading, isError, refetch } = useAttributes();
  const deleteAttribute = useDeleteAttribute();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Attribute | null>(null);
  const [target, setTarget] = React.useState<Attribute | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const attributes = React.useMemo(
    () =>
      [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [data],
  );
  const isEmpty = !isLoading && !isError && attributes.length === 0;

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteAttribute.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Attribute "${target.name}" deleted`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete attribute'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          New attribute
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={ListChecks}
            title="No attributes"
            description="Create attributes like Color or Size to power variants and filters."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                New attribute
              </Button>
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Flags</TableHead>
                <TableHead className="w-20">Values</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attr) => (
                <TableRow key={attr.id}>
                  <TableCell>
                    <Link
                      href={`/admin/attributes/${attr.id}`}
                      className="font-medium hover:underline"
                    >
                      {attr.name}
                    </Link>
                    <code className="ml-2 text-xs text-muted-foreground">{attr.slug}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{attr.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden gap-1 sm:flex">
                    {attr.isVariation && (
                      <Badge variant="secondary" className="text-[10px]">
                        Variation
                      </Badge>
                    )}
                    {attr.isFilterable && (
                      <Badge variant="secondary" className="text-[10px]">
                        Filterable
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {attr.values.length}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${attr.name}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/attributes/${attr.id}`}>
                            <Settings2 className="size-4" aria-hidden />
                            Manage values
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(attr);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" aria-hidden />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteError(null);
                            setTarget(attr);
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DataState>

      <AttributeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} attribute={editing} />

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={`Delete "${target?.name}"?`}
        description="Deletion fails if the attribute is assigned to products or SKUs."
        confirmLabel="Delete attribute"
        destructive
        loading={deleteAttribute.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
