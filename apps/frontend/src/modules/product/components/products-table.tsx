'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Search, Shirt, Trash2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useBrandOptions } from '@/modules/brand/queries';
import { CategorySelect } from '@/modules/category/components/category-select';
import { useDeleteProduct, useProducts } from '../queries';
import { PRODUCT_STATUSES, type Product, type ProductStatus } from '../types';
import { ProductStatusBadge } from './product-status-badge';

const PAGE_SIZE = 20;
const ALL = 'all';

export function ProductsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const urlSearch = searchParams.get('search') ?? '';
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const brandId = searchParams.get('brandId') ?? undefined;
  const status = (searchParams.get('status') as ProductStatus | null) ?? undefined;
  const sort = (searchParams.get('sort') as 'newest' | 'oldest' | 'name' | null) ?? undefined;

  const [searchInput, setSearchInput] = React.useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 350);

  const { data: brands } = useBrandOptions();

  const setParams = React.useCallback(
    (next: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === '' || v === ALL) params.delete(k);
        else params.set(k, String(v));
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  React.useEffect(() => {
    if (debouncedSearch !== urlSearch) setParams({ search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch } = useProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoryId,
    brandId,
    status,
    sort,
  });

  const deleteProduct = useDeleteProduct();
  const [target, setTarget] = React.useState<Product | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const confirmDelete = () => {
    if (!target) return;
    setDeleteError(null);
    deleteProduct.mutate(target.id, {
      onSuccess: () => {
        toast.success(`Product "${target.name}" deleted`);
        setTarget(null);
      },
      onError: (err) =>
        setDeleteError(err instanceof ApiError ? err.messages[0] : 'Failed to delete product'),
    });
  };

  const products = data?.items ?? [];
  const isEmpty = !isLoading && !isError && products.length === 0;
  const hasFilters = !!(debouncedSearch || categoryId || brandId || status);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
            aria-label="Search products"
          />
        </div>
        <CategorySelect
          value={categoryId ?? undefined}
          onChange={(v) => setParams({ categoryId: v, page: 1 })}
          placeholder="All categories"
        />
        <Select value={brandId ?? ALL} onValueChange={(v) => setParams({ brandId: v, page: 1 })}>
          <SelectTrigger aria-label="Filter by brand">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All brands</SelectItem>
            {(brands ?? []).map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status ?? ALL} onValueChange={(v) => setParams({ status: v, page: 1 })}>
          <SelectTrigger aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {PRODUCT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Select
          value={sort ?? 'newest'}
          onValueChange={(v) => setParams({ sort: v === 'newest' ? undefined : v, page: 1 })}
        >
          <SelectTrigger className="w-40" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)}>
            Clear filters
          </Button>
        )}
      </div>

      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        isEmpty={isEmpty}
        emptyFallback={
          <EmptyState
            icon={Shirt}
            title={hasFilters ? 'No products match' : 'No products yet'}
            description={hasFilters ? 'Try adjusting filters.' : 'Create your first product.'}
            action={
              !hasFilters ? (
                <Button asChild>
                  <Link href="/admin/products/new">New product</Link>
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Brand</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <code className="block text-xs text-muted-foreground">{p.slug}</code>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {p.category?.name ?? '—'}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {p.brand?.name ?? '—'}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-[10px]">
                      {p.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${p.name}`}>
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${p.id}`}>
                            <Pencil className="size-4" aria-hidden />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => {
                            setDeleteError(null);
                            setTarget(p);
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
        title={`Delete "${target?.name}"?`}
        description="The product is archived (soft-deleted) and removed from listings."
        confirmLabel="Delete product"
        destructive
        loading={deleteProduct.isPending}
        errorMessage={deleteError}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
