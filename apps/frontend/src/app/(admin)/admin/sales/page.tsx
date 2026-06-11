import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { SalesTable } from '@/modules/sale/components/sales-table';

export const metadata = { title: 'Sales · Admin', description: 'Manage sales and promotions.' };

export default function SalesPage() {
  return (
    <div>
      <PageHeader
        title="Sales"
        description="Time-bound automatic discounts. Lowest matching price wins."
        action={
          <Button asChild>
            <Link href="/admin/sales/new">
              <Plus className="size-4" aria-hidden />
              New sale
            </Link>
          </Button>
        }
      />
      <Suspense>
        <SalesTable />
      </Suspense>
    </div>
  );
}
