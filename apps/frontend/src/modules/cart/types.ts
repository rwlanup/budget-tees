/** Mirrors backend PricedCart / PricedCartLine (live-priced, never trusts stored prices). */
export interface PricedCartLine {
  itemId: string;
  skuId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  onSale: boolean;
  lineTotal: number;
  available: number;
  inStock: boolean;
  unavailable: boolean;
}

export interface PricedCart {
  id: string;
  currency: string;
  itemCount: number;
  items: PricedCartLine[];
  subtotal: number;
  notes: string[];
  /** Server-issued guest token (null for logged-in carts). Persisted client-side. */
  token: string | null;
}

export interface AddItemBody {
  skuId: string;
  quantity: number;
}
