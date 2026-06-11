import { PageHeader } from '@/components/shared/page-header';
import { LowStockReport } from '@/modules/sku/components/low-stock-report';

export const metadata = { title: 'Low stock · Admin', description: 'Monitor low-stock SKUs.' };

export default function SkusPage() {
  return (
    <div>
      <PageHeader
        title="Low Stock Product Variants"
        description="Low-stock report. Manage a product's variants from its page."
      />
      <LowStockReport />
    </div>
  );
}
