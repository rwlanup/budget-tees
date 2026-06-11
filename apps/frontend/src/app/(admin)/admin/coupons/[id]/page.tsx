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
import { useCoupon } from '@/modules/coupon/queries';
import { CouponEditForm } from '@/modules/coupon/components/coupon-edit-form';

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: coupon, isLoading, isError, refetch } = useCoupon(id);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/coupons">Coupons</Link>
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
        {coupon && <CouponEditForm coupon={coupon} />}
      </DataState>
    </div>
  );
}
