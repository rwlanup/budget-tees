'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  FolderTree,
  MoreHorizontal,
  Move,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataState } from '@/components/shared/data-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCategoryTree } from '../queries';
import type { Category } from '../types';
import { CategoryFormDialog } from './category-form-dialog';
import { MoveCategoryDialog } from './move-category-dialog';
import { DeleteCategoryDialog } from './delete-category-dialog';

export function CategoryManager() {
  const { data: tree, isLoading, isError, refetch } = useCategoryTree();

  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createParent, setCreateParent] = React.useState<Category | null>(null);
  const [editTarget, setEditTarget] = React.useState<Category | null>(null);
  const [moveTarget, setMoveTarget] = React.useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openCreate = (parent: Category | null) => {
    setCreateParent(parent);
    setCreateOpen(true);
  };

  const nodes = tree ?? [];
  const isEmpty = !isLoading && !isError && nodes.length === 0;

  const renderNodes = (list: Category[], depth: number): React.ReactNode =>
    list.map((node) => {
      const hasChildren = (node.children?.length ?? 0) > 0;
      const isOpen = expanded.has(node.id);
      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 border-b py-2 pr-2 hover:bg-accent/50"
            style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(node.id)}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label={isOpen ? 'Collapse' : 'Expand'}
                aria-expanded={isOpen}
              >
                {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
            ) : (
              <span className="flex size-6 items-center justify-center text-muted-foreground/50">
                {depth > 0 ? (
                  <CornerDownRight className="size-3.5" />
                ) : (
                  <FolderTree className="size-3.5" />
                )}
              </span>
            )}

            <span className={cn('font-medium', !node.isActive && 'text-muted-foreground')}>
              {node.name}
            </span>
            <code className="text-xs text-muted-foreground">{node.slug}</code>
            {!node.isActive && (
              <Badge variant="secondary" className="text-[10px]">
                Inactive
              </Badge>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
                #{node.sortOrder}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={`Actions for ${node.name}`}
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openCreate(node)}>
                    <Plus className="size-4" aria-hidden />
                    Add subcategory
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setEditTarget(node)}>
                    <Pencil className="size-4" aria-hidden />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setMoveTarget(node)}>
                    <Move className="size-4" aria-hidden />
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteTarget(node)}>
                    <Trash2 className="size-4" aria-hidden />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {hasChildren && isOpen && renderNodes(node.children!, depth + 1)}
        </div>
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openCreate(null)}>
          <Plus className="size-4" aria-hidden />
          New category
        </Button>
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        loadingFallback={<Skeleton className="h-64 w-full" />}
        emptyFallback={
          <EmptyState
            icon={FolderTree}
            title="No categories"
            description="Create your first top-level category."
            action={<Button onClick={() => openCreate(null)}>New category</Button>}
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">{renderNodes(nodes, 0)}</div>
      </DataState>

      <CategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        parentId={createParent?.id ?? null}
        parentName={createParent?.name ?? null}
      />
      <CategoryFormDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        category={editTarget}
      />
      <MoveCategoryDialog
        open={!!moveTarget}
        onOpenChange={(o) => !o && setMoveTarget(null)}
        category={moveTarget}
        tree={nodes}
      />
      <DeleteCategoryDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        category={deleteTarget}
      />
    </div>
  );
}
