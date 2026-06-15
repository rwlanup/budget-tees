import { ValueTransformer } from 'typeorm';

/**
 * Column transformers for Postgres `numeric`/`decimal` columns, which the pg
 * driver returns as strings — these coerce them back to `number` on read.
 *
 * - `numeric` maps NULL → 0 (non-nullable money/qty columns).
 * - `numericNullable` preserves NULL.
 */
export const numeric: ValueTransformer = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? 0 : parseFloat(v)),
};

export const numericNullable: ValueTransformer = {
  to: (v: number | null) => v,
  from: (v: string | null) => (v === null ? null : parseFloat(v)),
};
