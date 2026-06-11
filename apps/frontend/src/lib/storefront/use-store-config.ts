'use client';

import { usePublicSettings } from '@/modules/settings/queries';

export interface StoreConfig {
  storeName: string;
  currency: string;
  supportEmail: string | null;
  returnWindowDays: number | null;
}

const DEFAULTS: StoreConfig = {
  storeName: 'Budget Tees',
  currency: 'NPR',
  supportEmail: null,
  returnWindowDays: null,
};

/** Store config with safe fallbacks — never blocks render if settings fail. */
export function useStoreConfig(): StoreConfig {
  const { data } = usePublicSettings();
  if (!data) return DEFAULTS;
  return {
    storeName: (data['store.name'] as string) || DEFAULTS.storeName,
    currency: (data['store.currency'] as string) || DEFAULTS.currency,
    supportEmail: (data['store.supportEmail'] as string) || null,
    returnWindowDays:
      typeof data['returns.windowDays'] === 'number' ? data['returns.windowDays'] : null,
  };
}
