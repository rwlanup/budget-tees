import type { Metadata } from 'next';
import { categoryApi } from '@/modules/category/api';
import { CategoryDetail } from '@/components/storefront/category-detail';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await categoryApi.get(slug);
    const title = category.metaTitle?.trim()
      ? { absolute: category.metaTitle.trim() }
      : category.name;
    const description =
      category.metaDescription?.trim() ||
      category.description?.trim() ||
      `Shop ${category.name} at Budget Tees.`;
    return { title, description };
  } catch {
    return { title: 'Category' };
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryDetail slug={slug} />;
}
