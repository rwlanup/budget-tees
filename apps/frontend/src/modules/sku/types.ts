export type StockMovementType = 'RESERVE' | 'COMMIT' | 'RELEASE' | 'ADJUST' | 'RESTOCK' | 'RETURN';

/** Mirrors backend Sku entity (numeric columns coerced to number). */
export interface Sku {
  id: string;
  productId: string;
  sku: string;
  name: string | null;
  barcode: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number;
  reserved: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  weightGrams: number | null;
  imageMediaId: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** stock − reserved (entity getter is not serialized over JSON). */
export function skuAvailable(sku: Sku): number {
  return sku.stock - sku.reserved;
}

export function isLowStock(sku: Sku): boolean {
  return sku.lowStockThreshold > 0 && skuAvailable(sku) <= sku.lowStockThreshold;
}

export interface StockMovement {
  id: string;
  skuId: string;
  type: StockMovementType;
  qty: number;
  reason: string | null;
  refType: string | null;
  refId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface GenerateResult {
  created: Sku[];
  skipped: number;
}
