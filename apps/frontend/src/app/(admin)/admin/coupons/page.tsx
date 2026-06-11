import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { CouponsTable } from '@/modules/coupon/components/coupons-table';

export const metadata = { title: 'Coupons · Admin', description: 'Manage discount coupons.' };

export default function CouponsPage() {
  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Code-based discounts. One per order, applied on top of sale prices."
        action={
          <Button asChild>
            <Link href="/admin/coupons/new">
              <Plus className="size-4" aria-hidden />
              New coupon
            </Link>
          </Button>
        }
      />
      <Suspense>
        <CouponsTable />
      </Suspense>
    </div>
  );
}
