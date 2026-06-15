import type { Country } from 'react-phone-number-input';

/**
 * Countries whose phone numbers are accepted. Mirror of the backend
 * `ALLOWED_PHONE_COUNTRIES` (apps/backend/src/common/config/phone-countries.ts).
 */
export const ALLOWED_PHONE_COUNTRIES: Country[] = ['NP'];

/** Country pre-selected in the phone field. */
export const DEFAULT_PHONE_COUNTRY: Country = ALLOWED_PHONE_COUNTRIES[0];
