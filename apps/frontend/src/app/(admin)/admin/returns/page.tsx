import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ReturnsTable } from '@/modules/return/components/returns-table';

export const metadata = { title: 'Returns · Admin', description: 'Manage return requests.' };

export default function ReturnsPage() {
  return (
    <div>
      <PageHeader title="Returns" description="Review, receive, and resolve return requests." />
      <Suspense>
        <ReturnsTable />
      </Suspense>
    </div>
  );
}
