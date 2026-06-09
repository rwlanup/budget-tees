export enum AttributeType {
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  COLOR = 'COLOR',
}

/** Types allowed to act as variation axes (discrete values). */
export const VARIATION_TYPES = [
  AttributeType.SELECT,
  AttributeType.MULTISELECT,
  AttributeType.COLOR,
];
