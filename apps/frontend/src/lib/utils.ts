import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatters = new Map<string, Intl.NumberFormat>();

/** Format a numeric amount as currency. Backend computes amounts; we only display. */
export function formatCurrency(amount: number, currency = 'NPR', locale = 'en-US'): string {
  const key = `${locale}:${currency}`;
  let fmt = currencyFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { style: 'currency', currency });
    currencyFormatters.set(key, fmt);
  }
  return fmt.format(amount);
}

export function formatDate(value: string | Date, locale = 'en-US'): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}
