export type AttributeType = 'SELECT' | 'MULTISELECT' | 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'COLOR';

export const ATTRIBUTE_TYPES: AttributeType[] = [
  'SELECT',
  'MULTISELECT',
  'TEXT',
  'NUMBER',
  'BOOLEAN',
  'COLOR',
];

/** Types eligible to be variation axes (mirrors backend VARIATION_TYPES). */
export const VARIATION_TYPES: AttributeType[] = ['SELECT', 'MULTISELECT', 'COLOR'];

export function isVariationType(type: AttributeType): boolean {
  return VARIATION_TYPES.includes(type);
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  slug: string;
  meta: Record<string, unknown> | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors backend Attribute entity (values eager). */
export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: AttributeType;
  isVariation: boolean;
  isFilterable: boolean;
  sortOrder: number;
  values: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

/** Swatch hex stored in a COLOR value's meta. */
export function valueHex(value: AttributeValue): string | undefined {
  const hex = value.meta?.hex;
  return typeof hex === 'string' ? hex : undefined;
}
