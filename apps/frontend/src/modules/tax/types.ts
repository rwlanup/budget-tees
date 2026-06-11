/** Mirrors backend TaxClass entity. */
export interface TaxClass {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors backend TaxRate entity. */
export interface TaxRate {
  id: string;
  taxClassId: string;
  name: string;
  countryCode: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
