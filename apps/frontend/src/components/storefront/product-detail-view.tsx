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
    ? null
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
      <nav className="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="px-1">/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-foreground">
          {product.category.name}
        </Link>
        <span className="px-1">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={galleryImages}
          featuredUrl={featuredUrl}
          productName={product.name}
        />

        <div className="space-y-5">
          <div>
            {product.brand && <p className="text-sm text-muted-foreground">{product.brand.name}</p>}
            <h1 className="font-heading text-2xl font-bold md:text-3xl">{product.name}</h1>
            <ProductRatingSummary productId={product.id} />
            {product.shortDescription && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{product.shortDescription}</p>
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
                <span className="inline-flex items-center gap-1.5 text-success">
                  <span className="size-2 rounded-full bg-success" aria-hidden />
                  In stock
                </span>
              ) : (
                <Badge variant="secondary">Sold out</Badge>
              )
            ) : (
              <span className="text-muted-foreground">Select options to see availability</span>
            )}
          </div>

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
                className="inline-flex h-11 flex-1 cursor-not-allowed items-center justify-center rounded-md bg-secondary px-6 text-sm font-medium text-muted-foreground sm:flex-none"
              >
                Select options
              </button>
            )}
            <WishlistButton skuId={activeVariant?.skuId ?? detail.defaultSkuId} mode="detail" />
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
