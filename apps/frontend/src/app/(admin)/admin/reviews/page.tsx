import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { AdminReviewsTable } from '@/modules/review/components/admin-reviews-table';

export const metadata = { title: 'Reviews · Admin', description: 'Moderate product reviews.' };

export default function ReviewsPage() {
  return (
    <div>
      <PageHeader title="Reviews" description="Moderate product reviews — publish, hide, or remove." />
      <Suspense>
        <AdminReviewsTable />
      </Suspense>
    </div>
  );
}
