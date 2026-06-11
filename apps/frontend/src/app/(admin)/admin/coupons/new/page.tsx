import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/shared/page-header';
import { CouponCreateForm } from '@/modules/coupon/components/coupon-create-form';

export const metadata = { title: 'New coupon · Admin', description: 'Create a discount coupon.' };

export default function NewCouponPage() {
  return (
    <div>
      <PageHeader title="New coupon" description="Create a discount code.">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/coupons">Coupons</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>New</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </PageHeader>
      <CouponCreateForm />
    </div>
  );
}
