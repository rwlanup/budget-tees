export type AddressType = 'SHIPPING' | 'BILLING' | 'BOTH';

/** Mirrors backend UserAddress entity. */
export interface UserAddress {
  id: string;
  userId: string;
  type: AddressType;
  label: string | null;
  recipientName: string;
  phone: string;
  email: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  countryCode: string;
  postalCode: string | null;
  nearestLandmark: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
