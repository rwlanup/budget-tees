/**
 * Money helpers. All monetary values are numeric(12,2) in NPR (or store currency).
 * Single rounding rule: round half-up to 2 decimals. Never do float math without rounding.
 */
export function round2(value: number): number {
  // Avoid binary float drift: shift, round half-up, shift back.
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function addMoney(...values: number[]): number {
  return round2(values.reduce((sum, v) => sum + v, 0));
}

export function multiplyMoney(unit: number, qty: number): number {
  return round2(unit * qty);
}

/** Extract tax embedded in a tax-inclusive amount. Returns { net, tax }. */
export function extractInclusiveTax(
  inclusiveAmount: number,
  ratePercent: number,
): {
  net: number;
  tax: number;
} {
  if (ratePercent <= 0) return { net: round2(inclusiveAmount), tax: 0 };
  const net = round2(inclusiveAmount / (1 + ratePercent / 100));
  return { net, tax: round2(inclusiveAmount - net) };
}
