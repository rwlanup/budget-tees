import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PaymentsTable } from '@/modules/payment/components/payments-table';

export const metadata = { title: 'Payments · Admin', description: 'View payment transactions.' };

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader title="Payments" description="Payment ledger, refunds, and COD settlement." />
      <Suspense>
        <PaymentsTable />
      </Suspense>
    </div>
  );
}
