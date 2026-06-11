export type SaleType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type SaleScope = 'PRODUCTS' | 'CATEGORIES' | 'STORE_WIDE';

export const SALE_TYPES: SaleType[] = ['PERCENTAGE', 'FIXED_AMOUNT'];
export const SALE_SCOPES: SaleScope[] = ['PRODUCTS', 'CATEGORIES', 'STORE_WIDE'];

/** Mirrors backend Sale entity (link arrays are NOT returned by the API). */
export interface Sale {
  id: string;
  name: string;
  type: SaleType;
  value: number;
  maxDiscountAmount: number | null;
  scope: SaleScope;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SaleStatus = 'inactive' | 'upcoming' | 'active' | 'expired';

/** Derive a display status from the window + isActive flag. */
export function saleStatus(sale: Sale, now = new Date()): SaleStatus {
  if (!sale.isActive) return 'inactive';
  const start = new Date(sale.startsAt);
  const end = new Date(sale.endsAt);
  if (now < start) return 'upcoming';
  if (now > end) return 'expired';
  return 'active';
}
