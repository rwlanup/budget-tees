import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ProductsTable } from '@/modules/product/components/products-table';

export const metadata = { title: 'Products · Admin', description: 'Manage the product catalogue.' };

export default function ProductsPage() {
  return (
    <div>
      <PageHeader
        title="Products"
        description="Catalog products, media, attributes, and status."
        action={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" aria-hidden />
              New product
            </Link>
          </Button>
        }
      />
      <Suspense>
        <ProductsTable />
      </Suspense>
    </div>
  );
}
