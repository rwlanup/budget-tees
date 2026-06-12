import type { Metadata } from 'next';
import { catalogApi } from '@/modules/catalog/api';
import { ProductDetailPage } from '@/components/storefront/product-detail-page';

/** Trim, collapse whitespace, and cap at ~160 chars for meta description. */
function clamp(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { product } = await catalogApi.productDetail(slug);
    const title = product.metaTitle?.trim() ? { absolute: product.metaTitle.trim() } : product.name;
    const source =
      product.metaDescription?.trim() ||
      product.shortDescription?.trim() ||
      product.description?.trim();
    const description = source ? clamp(source) : `Buy ${product.name} at Budget Tees.`;
    return { title, description };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} />;
}
