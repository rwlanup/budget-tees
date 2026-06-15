import type { CountryCode } from 'libphonenumber-js';

/**
 * Single source of truth for which countries' phone numbers the app accepts.
 * Keep in sync with the frontend mirror (`apps/frontend/src/config/phone.ts`).
 */
export const ALLOWED_PHONE_COUNTRIES: readonly CountryCode[] = ['NP'];
