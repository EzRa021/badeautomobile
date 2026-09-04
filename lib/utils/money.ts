/** Money helpers. All money is handled as numbers with 2 decimals (Naira/Kobo). */

export const NAIRA = "₦"; // ₦

/** Format a number as "1,234,567.00" (no currency symbol). */
export function formatAmount(value: number | string | null | undefined): string {
  const n = toNumber(value);
  return n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format with the Naira sign, e.g. "₦1,234,567.00". */
export function formatNaira(value: number | string | null | undefined): string {
  return `${NAIRA}${formatAmount(value)}`;
}

/** Coerce anything to a finite number, defaulting to 0. */
export function toNumber(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Round to 2 decimals, avoiding float drift. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
