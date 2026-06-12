import { PageHeader } from '@/components/shared/page-header';
import { FeaturedManager } from '@/modules/featured/components/featured-manager';

export const metadata = {
  title: 'Featured products · Admin',
  description: 'Manage featured products.',
};

export default function FeaturedPage() {
  return (
    <div>
      <PageHeader
        title="Featured products"
        description="Curate the products highlighted on the storefront homepage."
      />
      <FeaturedManager />
    </div>
  );
}
