'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { DataState } from '@/components/shared/data-state';
import { useSale } from '@/modules/sale/queries';
import { SaleEditForm } from '@/modules/sale/components/sale-edit-form';

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: sale, isLoading, isError, refetch } = useSale(id);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/sales">Sales</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DataState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        loadingFallback={<Skeleton className="h-96 w-full max-w-2xl" />}
      >
        {sale && <SaleEditForm sale={sale} />}
      </DataState>
    </div>
  );
}
