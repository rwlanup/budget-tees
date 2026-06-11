import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { AdminContactTable } from '@/modules/contact/components/admin-contact-table';

export const metadata = { title: 'Contact messages · Admin', description: 'Triage customer and guest support messages.' };

export default function ContactMessagesPage() {
  return (
    <div>
      <PageHeader
        title="Contact messages"
        description="Support messages from customers and guests — triage by status (pending, processing, resolved)."
      />
      <Suspense>
        <AdminContactTable />
      </Suspense>
    </div>
  );
}
