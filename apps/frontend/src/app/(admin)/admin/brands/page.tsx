import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { BrandsTable } from '@/modules/brand/components/brands-table';

export const metadata = { title: 'Brands · Admin', description: 'Manage product brands.' };

export default function BrandsPage() {
  return (
    <div>
      <PageHeader title="Brands" description="Manufacturers and labels linked to products." />
      <Suspense>
        <BrandsTable />
      </Suspense>
    </div>
  );
}
