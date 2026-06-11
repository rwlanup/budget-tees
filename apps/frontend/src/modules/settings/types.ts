export type SettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'STRING_ARRAY';

/** Mirrors backend admin setting record (schema-driven). */
export interface SettingRecord {
  key: string;
  value: unknown;
  type: SettingType;
  group: string;
  isPublic: boolean;
  description: string;
}

/** Mirrors backend ShippingCountry entity. */
export interface ShippingCountry {
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Public store config from `GET /settings/public` — a flat key→value map of
 * `isPublic` settings. Keys mirror `settings-schema.ts`. All optional; the
 * storefront falls back to sane defaults when a key is absent.
 */
export interface PublicSettings {
  'store.name'?: string;
  'store.currency'?: string;
  'store.supportEmail'?: string;
  'returns.windowDays'?: number;
  [key: string]: unknown;
}

/** Human labels for known setting groups (falls back to capitalized key). */
export const GROUP_LABELS: Record<string, string> = {
  store: 'Store',
  order: 'Orders',
  tax: 'Tax',
  returns: 'Returns',
  email: 'Email',
};
