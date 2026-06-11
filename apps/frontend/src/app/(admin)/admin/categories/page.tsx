import { PageHeader } from '@/components/shared/page-header';
import { CategoryManager } from '@/modules/category/components/category-manager';

export const metadata = { title: 'Categories · Admin', description: 'Manage product categories.' };

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader title="Categories" description="Organize products into a navigable hierarchy." />
      <CategoryManager />
    </div>
  );
}
