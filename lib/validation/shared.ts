import { z } from "zod";

/** Coerce a form value into a number (strips commas, empty → 0). */
export const zMoney = z.preprocess((v) => {
  if (v === "" || v == null) return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}, z.number().min(0, "Must be 0 or more"));

/** Optional positive-ish number that may be null (e.g. a blank rate). */
export const zMoneyNullable = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}, z.number().min(0).nullable());

export const zQty = z.preprocess((v) => {
  if (v === "" || v == null) return 1;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 1;
}, z.number().min(0));

/** Trim to null when empty. */
export const zOptText = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : v),
  z.string().max(4000).nullish().transform((v) => (v ? v : null)),
);

export const zRequiredText = (label = "This field") =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string().min(1, `${label} is required`).max(2000),
  );

export const zDate = z.preprocess((v) => {
  if (!v) return undefined;
  return String(v);
}, z.string().min(1, "Date is required"));

export type FieldErrors = Record<string, string[]>;

export interface ActionState {
  ok?: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
}
