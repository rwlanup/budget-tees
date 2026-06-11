import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { TaxTabs } from '@/modules/tax/components/tax-tabs';

export const metadata = { title: 'Tax · Admin', description: 'Manage tax rates.' };

export default function TaxPage() {
  return (
    <div>
      <PageHeader title="Tax" description="Tax classes and country rates." />
      <Suspense>
        <TaxTabs />
      </Suspense>
    </div>
  );
}
