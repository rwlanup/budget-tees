/** Mirrors backend PickupLocation entity. */
export interface PickupLocation {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  line1: string;
  city: string;
  region: string | null;
  countryCode: string;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  openingHours: Record<string, unknown> | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingZoneRegion {
  id: string;
  zoneId: string;
  region: string;
}

/** Mirrors backend ShippingZone entity (regions eager). */
export interface ShippingZone {
  id: string;
  name: string;
  countryCode: string;
  isCountryWide: boolean;
  flatRate: number;
  freeShippingThreshold: number | null;
  isActive: boolean;
  sortOrder: number;
  regions: ShippingZoneRegion[];
  createdAt: string;
  updatedAt: string;
}
