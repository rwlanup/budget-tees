/** Mirrors backend wishlist.list item (variant-level + saved-SKU pricing). */
export interface WishlistItem {
  skuId: string;
  productId: string;
  /** Human variant label (sku.name, falls back to product name). */
  name: string;
  productName: string;
  slug: string;
  imageMediaId: string | null;
  basePrice: number;
  salePrice: number;
  onSale: boolean;
  inStock: boolean;
  addedAt: string;
}

export interface WishlistState {
  wishlisted: boolean;
}
