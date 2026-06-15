'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PriceTag } from './price-tag';
import { ProductGallery, type GalleryImage } from './product-gallery';
import { VariantSelector } from './variant-selector';
import { QuantityStepper } from './quantity-stepper';
import { AddToCartButton } from './add-to-cart-button';
import { WishlistButton } from './wishlist-button';
import { ProductTabs } from './product-tabs';
import { ProductRatingSummary } from './product-rating-summary';
import { RelatedProducts } from './related-products';
import {
  imageUrl,
  type StorefrontProductDetail,
  type StorefrontVariantDetail,
} from '@/modules/catalog/types';

/** Find which axis a value id belongs to. */
function axisOfValue(detail: StorefrontProductDetail, valueId: string): string | null {
  for (const ax of detail.axes) if (ax.values.some((v) => v.id === valueId)) return ax.attributeId;
  return null;
}

function seedSelection(
  detail: StorefrontProductDetail,
  initialSkuId?: string,
): Record<string, string> {
  if (!detail.axes.length || !initialSkuId) return {};
  const target =
    detail.variants.find((v) => v.skuId === initialSkuId) ??
    detail.variants.find((v) => v.skuId === detail.defaultSkuId) ??
    detail.variants[0];
  if (!target) return {};
  const sel: Record<string, string> = {};
  for (const valueId of target.attributeValueIds) {
    const axisId = axisOfValue(detail, valueId);
    if (axisId) sel[axisId] = valueId;
  }
  return sel;
}

export function ProductDetailView({
  detail,
  initialSkuId,
}: {
  detail: StorefrontProductDetail;
  initialSkuId?: string;
}) {
  const { product, axes, variants } = detail;
  const [selected, setSelected] = React.useState<Record<string, string>>(() =>
    seedSelection(detail, initialSkuId),
  );
  const [qty, setQty] = React.useState(1);

  const fullySelected = axes.every((ax) => selected[ax.attributeId]);
  const activeVariant: StorefrontVariantDetail | null = !axes.length
    ? (variants[0] ?? null)
    : fullySelected
      ? (variants.find((v) =>
          axes.every((ax) => v.attributeValueIds.includes(selected[ax.attributeId])),
        ) ?? null)
      : null;

  React.useEffect(() => setQty(1), [activeVariant?.skuId]);

  const galleryImages: GalleryImage[] = [...detail.gallery, ...detail.variants.map((v) => v.image)]
    .filter((g) => !!g?.url)
    .map((g) => ({ url: g!.url as string, alt: g!.alt }));
  const featuredUrl = activeVariant ? imageUrl(activeVariant.image, 'LARGE') : null;

  // Price: active variant, else a "from" using the cheapest variant.
  const cheapest = variants.reduce<StorefrontVariantDetail | null>(
    (lo, v) => (!lo || v.salePrice < lo.salePrice ? v : lo),
    null,
  );
  const priceVariant = activeVariant ?? cheapest;

  return (
    <div>
      <nav
        className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="transition-colors hover:text-brand">
          Home
        </Link>
        <span className="text-border">/</span>
        <Link
          href={`/category/${product.category.slug}`}
          className="transition-colors hover:text-brand"
        >
          {product.category.name}
        </Link>
        <span className="text-border">/</span>
        <span className="truncate font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <ProductGallery
          images={galleryImages}
          featuredUrl={featuredUrl}
          productName={product.name}
        />

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div>
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {product.brand.name}
              </p>
            )}
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {product.name}
            </h1>
            <div className="mt-2">
              <ProductRatingSummary productId={product.id} />
            </div>
            {product.shortDescription && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {product.shortDescription}
              </p>
            )}
          </div>

          {priceVariant && (
            <div className="flex items-center gap-2">
              {!activeVariant && <span className="text-sm text-muted-foreground">From</span>}
              <PriceTag
                price={priceVariant.price}
                salePrice={priceVariant.salePrice}
                compareAtPrice={priceVariant.compareAtPrice}
                onSale={priceVariant.onSale}
                discountPct={priceVariant.discountPct}
                size="lg"
              />
            </div>
          )}

          {axes.length > 0 && (
            <VariantSelector
              axes={axes}
              variants={variants}
              selected={selected}
              onSelect={(attrId, valueId) => setSelected((s) => ({ ...s, [attrId]: valueId }))}
            />
          )}

          <div className="text-sm">
            {activeVariant ? (
              activeVariant.inStock ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 font-medium text-success">
                  <span className="size-2 animate-pulse rounded-full bg-success" aria-hidden />
                  In stock
                </span>
              ) : (
                <Badge variant="secondary">Sold out</Badge>
              )
            ) : (
              <span className="text-muted-foreground">Select options to see availability</span>
            )}
          </div>

          {product.type === 'SIMPLE' && detail.attributes.length > 0 && (
            <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
              {detail.attributes.map((a) => (
                <React.Fragment key={a.attributeId}>
                  <dt className="text-muted-foreground">{a.name}</dt>
                  <dd className="font-medium">{a.values.map((v) => v.value).join(', ')}</dd>
                </React.Fragment>
              ))}
            </dl>
          )}

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={qty}
              onChange={setQty}
              max={activeVariant?.available || 99}
              disabled={!activeVariant?.inStock}
            />
            {activeVariant ? (
              <AddToCartButton
                skuId={activeVariant.skuId}
                inStock={activeVariant.inStock}
                quantity={qty}
                size="lg"
                className="flex-1 sm:flex-none"
              />
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-12 flex-1 cursor-not-allowed items-center justify-center rounded-xl bg-secondary px-7 text-sm font-semibold text-muted-foreground sm:flex-none"
              >
                Select options
              </button>
            )}
            <WishlistButton
              skuId={activeVariant?.skuId ?? detail.defaultSkuId}
              mode="detail"
              className="h-12 rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <ProductTabs detail={detail} activeSku={activeVariant?.sku ?? null} />
      </div>

      <RelatedProducts categoryId={product.category.id} excludeProductId={product.id} />
    </div>
  );
}
