/**
 * Quotation discount maths — the single source of truth.
 *
 * The same functions run in the browser (live totals while typing) and in the
 * server action (the figures that are actually stored and printed), so the
 * form can never show a number the PDF disagrees with.
 *
 * Model
 *   line gross     = qty × rate            (or the typed amount when there is no rate)
 *   line discount  = % of the gross, or a fixed ₦ amount (never more than the gross)
 *   line net       = gross − line discount  ← this is the "Amount" printed on the line
 *   sub-total      = Σ line nets
 *   overall disc.  = % of the sub-total, or a fixed ₦ amount (never more than it)
 *   total          = sub-total − overall discount
 *
 * Everything is rounded to the kobo per line, then summed, so the figures on a
 * printed quotation always add up exactly. Sums are done in integer kobo to
 * avoid floating-point drift.
 */

import { formatNaira } from "./money";

export type DiscountType = "percent" | "amount";

export const DEFAULT_DISCOUNT_TYPE: DiscountType = "percent";

/** Anything that is not explicitly "amount" is a percentage (the default). */
export function normalizeDiscountType(value: unknown): DiscountType {
  return value === "amount" ? "amount" : "percent";
}

export type DiscountIssue = "percent_over_100" | "exceeds_base";

const toKobo = (n: number): number => Math.round((n + Number.EPSILON) * 100);
const fromKobo = (k: number): number => k / 100;

function safe(n: number | null | undefined): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export interface DiscountResult {
  /** The ₦ taken off, already clamped to the base. */
  amount: number;
  /** Set when the entered value is not allowed (the amount is clamped regardless). */
  issue: DiscountIssue | null;
}

/** Work out a discount on `base`. Pure; never returns more than `base`. */
export function applyDiscount(base: number, type: DiscountType, value: number): DiscountResult {
  const baseK = Math.max(0, toKobo(safe(base)));
  const v = Math.max(0, safe(value));
  if (v === 0) return { amount: 0, issue: null };

  if (type === "percent") {
    const pct = Math.min(v, 100);
    return {
      amount: fromKobo(Math.round((baseK * pct) / 100)),
      issue: v > 100 ? "percent_over_100" : null,
    };
  }

  const valueK = toKobo(v);
  return {
    amount: fromKobo(Math.min(valueK, baseK)),
    issue: valueK > baseK ? "exceeds_base" : null,
  };
}

/** Plain-language reason a discount was refused, shared by the form and the server. */
export function discountIssueMessage(
  issue: DiscountIssue,
  /** What the discount is on: a line description, or "the sub-total". */
  base: { label?: string; amount: number; noun: "line amount" | "sub-total" },
): string {
  const prefix = base.label ? `"${base.label}": d` : "D";
  return issue === "percent_over_100"
    ? `${prefix}iscount can't be more than 100%.`
    : `${prefix}iscount can't be more than the ${base.noun} (${formatNaira(base.amount)}).`;
}

// --------------------------------------------------------------------- lines
export interface LineInput {
  qty: number;
  /** Null when the line is priced as a lump sum (e.g. Labour). */
  rate: number | null;
  /** Typed amount — only used when `rate` is null. */
  amount: number;
  discount_type: DiscountType;
  discount_value: number;
}

export interface LineResult {
  gross: number;
  discount: number;
  net: number;
  issue: DiscountIssue | null;
}

/** The pre-discount line amount: qty × rate, else the typed amount. */
export function lineGross(qty: number, rate: number | null, amount: number): number {
  const gross = rate != null ? safe(qty) * safe(rate) : safe(amount);
  return fromKobo(Math.max(0, toKobo(gross)));
}

export function computeLine(input: LineInput): LineResult {
  const gross = lineGross(input.qty, input.rate, input.amount);
  const { amount: discount, issue } = applyDiscount(gross, input.discount_type, input.discount_value);
  return {
    gross,
    discount,
    net: fromKobo(toKobo(gross) - toKobo(discount)),
    issue,
  };
}

// ----------------------------------------------------------------- quotation
export interface QuotationTotals {
  lines: LineResult[];
  /** Σ line gross — before any discount. */
  gross: number;
  /** Σ per-item discounts. */
  itemDiscounts: number;
  /** Σ line net — after item discounts, before the overall discount. */
  subtotal: number;
  /** The overall (whole-quotation) discount in ₦. */
  discount: number;
  discountIssue: DiscountIssue | null;
  /** Final payable amount. */
  total: number;
}

export function computeQuotation(
  lines: LineInput[],
  overall: { type: DiscountType; value: number },
): QuotationTotals {
  const results = lines.map(computeLine);
  const sum = (pick: (l: LineResult) => number) =>
    fromKobo(results.reduce((s, l) => s + toKobo(pick(l)), 0));

  const gross = sum((l) => l.gross);
  const itemDiscounts = sum((l) => l.discount);
  const subtotal = sum((l) => l.net);
  const { amount: discount, issue } = applyDiscount(subtotal, overall.type, overall.value);

  return {
    lines: results,
    gross,
    itemDiscounts,
    subtotal,
    discount,
    discountIssue: issue,
    total: fromKobo(toKobo(subtotal) - toKobo(discount)),
  };
}

// -------------------------------------------------------------- allocation
/**
 * Spread a whole-document discount across lines in proportion to their net
 * amounts, to the kobo, so the pieces add back to exactly `discount`
 * (largest-remainder method). Used where a consumer only understands per-line
 * prices — an invoice, a Fairmarkit bid sheet.
 */
export function allocateDiscount(nets: number[], discount: number): number[] {
  const netK = nets.map((n) => Math.max(0, toKobo(safe(n))));
  const totalK = netK.reduce((s, k) => s + k, 0);
  const discK = Math.min(Math.max(0, toKobo(safe(discount))), totalK);
  if (totalK === 0 || discK === 0) return nets.map(() => 0);

  const exact = netK.map((k) => (k * discK) / totalK);
  const floors = exact.map(Math.floor);
  let remaining = discK - floors.reduce((s, k) => s + k, 0);

  // Biggest fractional parts get the leftover kobo; ties go to the earlier line.
  const order = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remaining <= 0) break;
    if (floors[i] < netK[i]) {
      floors[i] += 1;
      remaining -= 1;
    }
  }
  return floors.map(fromKobo);
}

interface PricedItem {
  rate: number | null;
  amount: number;
  discount_amount?: number | null;
}

/**
 * Items as they should be priced downstream (invoice, Fairmarkit): each line's
 * `amount` becomes its final net after item and overall discounts, and `rate`
 * is cleared so consumers derive the effective unit price from it.
 *
 * With no discounts at all the items come back untouched, so quotations that
 * predate discounts behave exactly as before.
 */
export function itemsAtFinalPrice<T extends PricedItem>(
  items: T[],
  overallDiscount: number | null | undefined,
): T[] {
  const overall = safe(overallDiscount);
  const anyItemDiscount = items.some((it) => safe(it.discount_amount) > 0);
  if (!anyItemDiscount && overall <= 0) return items;

  const shares = allocateDiscount(
    items.map((it) => it.amount),
    overall,
  );
  return items.map((it, i) => ({
    ...it,
    rate: null,
    amount: fromKobo(toKobo(safe(it.amount)) - toKobo(shares[i])),
  }));
}
