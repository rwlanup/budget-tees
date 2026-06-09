import { SettingType } from '../enums/setting-type.enum';

export interface SettingDefinition {
  key: string;
  type: SettingType;
  group: string;
  default: unknown;
  isPublic: boolean;
  description: string;
}

/** Registered setting keys — the whitelist + defaults. Unknown keys are rejected. */
export const SETTINGS_SCHEMA: Record<string, SettingDefinition> = {
  'store.name': {
    key: 'store.name',
    type: SettingType.STRING,
    group: 'store',
    default: 'Budget Tees',
    isPublic: true,
    description: 'Store display name',
  },
  'store.currency': {
    key: 'store.currency',
    type: SettingType.STRING,
    group: 'store',
    default: 'NPR',
    isPublic: true,
    description: 'Default currency (ISO 4217)',
  },
  'store.supportEmail': {
    key: 'store.supportEmail',
    type: SettingType.STRING,
    group: 'store',
    default: 'support@budgettees.local',
    isPublic: true,
    description: 'Customer support email',
  },
  'order.reservationTtlMinutes': {
    key: 'order.reservationTtlMinutes',
    type: SettingType.NUMBER,
    group: 'order',
    default: 30,
    isPublic: false,
    description: 'Minutes an unpaid online order holds reserved stock before auto-cancel',
  },
  'order.codCap': {
    key: 'order.codCap',
    type: SettingType.NUMBER,
    group: 'order',
    default: 50000,
    isPublic: false,
    description: 'Maximum order total allowed for Cash on Delivery',
  },
  'tax.shippingTaxable': {
    key: 'tax.shippingTaxable',
    type: SettingType.BOOLEAN,
    group: 'tax',
    default: false,
    isPublic: false,
    description: 'Whether shipping cost is taxed',
  },
  'returns.windowDays': {
    key: 'returns.windowDays',
    type: SettingType.NUMBER,
    group: 'returns',
    default: 7,
    isPublic: true,
    description: 'Days after delivery/pickup a return may be requested',
  },
  'email.fromName': {
    key: 'email.fromName',
    type: SettingType.STRING,
    group: 'email',
    default: 'Budget Tees',
    isPublic: false,
    description: 'Default sender name for emails',
  },
  'email.fromAddress': {
    key: 'email.fromAddress',
    type: SettingType.STRING,
    group: 'email',
    default: 'no-reply@budgettees.local',
    isPublic: false,
    description: 'Default sender address for emails',
  },
};

export type SettingKey = keyof typeof SETTINGS_SCHEMA;
