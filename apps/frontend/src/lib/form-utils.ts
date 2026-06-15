import type { ChangeEvent, Ref } from 'react';

/**
 * Bind an `<input type="number">` to a react-hook-form field, coercing the empty
 * string to `null` (when `nullable`) or `0`. Spread onto `<Input>` in place of
 * `{...field}`. Shared by every numeric form field across modules.
 */
export function numericFieldProps(
  field: {
    value: unknown;
    onChange: (v: unknown) => void;
    name: string;
    onBlur: () => void;
    ref: Ref<HTMLInputElement>;
  },
  opts: { nullable?: boolean } = {},
) {
  return {
    name: field.name,
    ref: field.ref,
    onBlur: field.onBlur,
    value: field.value === null || field.value === undefined ? '' : String(field.value),
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      field.onChange(e.target.value === '' ? (opts.nullable ? null : 0) : Number(e.target.value)),
  };
}
