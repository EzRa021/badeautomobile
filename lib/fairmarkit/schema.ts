import { z } from "zod";

/**
 * Shape of the Fairmarkit RFQ workbook, captured on import and stored on the
 * quotation so the export can hand Fairmarkit back a sheet it recognises.
 *
 * Columns A–M belong to the buyer and are marked "do not modify" in the
 * template, so they are preserved verbatim; columns N–W are the supplier's
 * answer and are regenerated from the quotation on every export.
 */

/** The 23 columns Fairmarkit emits, in order, used when we synthesise a sheet. */
export const FAIRMARKIT_HEADERS = [
  "Line #",
  "Line Type",
  "Item / Service description",
  "Manufacturer (from buyer)",
  "MFG Part # (from buyer)",
  "Unit of Measure",
  "Internal part number",
  "Suppliers part # (from buyer)",
  "Comments",
  "Start date",
  "End date",
  "Attachments",
  "Quantity",
  "Manufacturer (from supplier)",
  "MFG Part # (from supplier)",
  "Suppliers Part #",
  "Bid on this Line",
  "Unit Price/Response",
  "Delivery Days",
  "Supplier SKU",
  "Country of origin",
  "Minimum Order Quantity",
  "Comments",
] as const;

/** Column widths that match a sheet downloaded from Fairmarkit. */
export const FAIRMARKIT_COLUMN_WIDTHS = [
  7, 21, 35, 24, 22, 20, 20, 24, 25, 25, 13, 11, 13, 26, 24, 14, 25, 25, 25, 25, 25, 25, 25,
];

/** Fairmarkit rejects a blank answer, so unknown supplier fields go out as "NIL". */
export const FAIRMARKIT_NIL = "NIL";

export const FAIRMARKIT_DEFAULT_VALID_DAYS = 5;
export const FAIRMARKIT_DEFAULT_DELIVERY_DAYS = 3;
export const FAIRMARKIT_DEFAULT_CURRENCY = "NGN";

/** Fairmarkit writes unit prices with eight decimal places. */
export const FAIRMARKIT_PRICE_DECIMALS = 8;

export type FairmarkitRole =
  | "line_no"
  | "line_type"
  | "description"
  | "uom"
  | "qty"
  | "supplier_manufacturer"
  | "supplier_mfg_part"
  | "supplier_part"
  | "bid"
  | "unit_price"
  | "delivery_days"
  | "supplier_sku"
  | "country_of_origin"
  | "min_order_qty"
  | "supplier_comments"
  | "buyer";

/** Roles the supplier fills in — these are rewritten from the quotation. */
export const SUPPLIER_ROLES: ReadonlySet<FairmarkitRole> = new Set<FairmarkitRole>([
  "supplier_manufacturer",
  "supplier_mfg_part",
  "supplier_part",
  "bid",
  "unit_price",
  "delivery_days",
  "supplier_sku",
  "country_of_origin",
  "min_order_qty",
  "supplier_comments",
]);

/** Lower-case, collapse whitespace, drop trailing punctuation. */
export function normalizeLabel(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.:]+$/, "")
    .trim();
}

/**
 * Assign a role to every header cell. "Comments" appears twice (buyer in
 * column I, supplier in column W), so it is only treated as the supplier's
 * once the unit-price column has been seen.
 */
export function classifyHeaders(headers: readonly string[]): FairmarkitRole[] {
  let seenUnitPrice = false;
  return headers.map((header) => {
    const label = normalizeLabel(header);
    if (label === "line #" || label === "line number") return "line_no";
    if (label === "line type") return "line_type";
    if (/item.*description|^description$/.test(label)) return "description";
    if (label === "unit of measure" || label === "uom") return "uom";
    if (label === "quantity" || label === "qty") return "qty";
    if (label === "manufacturer (from supplier)") return "supplier_manufacturer";
    if (label === "mfg part # (from supplier)") return "supplier_mfg_part";
    if (label === "suppliers part #" || label === "supplier's part #") return "supplier_part";
    if (label === "bid on this line") return "bid";
    if (label.startsWith("unit price")) {
      seenUnitPrice = true;
      return "unit_price";
    }
    if (label === "delivery days") return "delivery_days";
    if (label === "supplier sku") return "supplier_sku";
    if (label === "country of origin") return "country_of_origin";
    if (label === "minimum order quantity") return "min_order_qty";
    if (label === "comments") return seenUnitPrice ? "supplier_comments" : "buyer";
    return "buyer";
  });
}

// ------------------------------------------------------------------ schemas
const cellSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const nullableText = z
  .union([z.string(), z.number(), z.null()])
  .nullish()
  .transform((v) => (v == null || v === "" ? null : String(v)));

const text = z
  .union([z.string(), z.number(), z.null()])
  .nullish()
  .transform((v) => (v == null ? "" : String(v)));

const positiveInt = (fallback: number) =>
  z
    .union([z.string(), z.number(), z.null()])
    .nullish()
    .transform((v) => {
      const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? "").replace(/,/g, ""));
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
    });

export const fairmarkitMetaSchema = z.object({
  buyer_name: nullableText,
  supplier_name: nullableText,
  title: nullableText,
  rfq_id: nullableText,
  scheduled_close: nullableText,
  shipping_method: nullableText,
  shipping_address: nullableText,
  preferred_delivery_date: nullableText,
  quote_number: nullableText,
  valid_days: positiveInt(FAIRMARKIT_DEFAULT_VALID_DAYS),
  currency: z
    .union([z.string(), z.null()])
    .nullish()
    .transform((v) => (v ? String(v).trim().toUpperCase() : FAIRMARKIT_DEFAULT_CURRENCY)),
  delivery_days: positiveInt(FAIRMARKIT_DEFAULT_DELIVERY_DAYS),
});
export type FairmarkitMeta = z.infer<typeof fairmarkitMetaSchema>;

export const fairmarkitSupplierSchema = z.object({
  manufacturer: text.default(FAIRMARKIT_NIL),
  mfg_part: text.default(FAIRMARKIT_NIL),
  part: text.default(FAIRMARKIT_NIL),
  sku: text.default(""),
  country_of_origin: text.default(""),
  min_order_qty: text.default(""),
  comments: text.default(""),
});
export type FairmarkitSupplierAnswer = z.infer<typeof fairmarkitSupplierSchema>;

/** What we send for a line whose supplier fields the buyer left blank. */
export const FAIRMARKIT_DEFAULT_ANSWER: FairmarkitSupplierAnswer = {
  manufacturer: FAIRMARKIT_NIL,
  mfg_part: FAIRMARKIT_NIL,
  part: FAIRMARKIT_NIL,
  sku: "",
  country_of_origin: "",
  min_order_qty: "",
  comments: "",
};

export const fairmarkitLineSchema = z.object({
  line_no: z
    .union([z.string(), z.number(), z.null()])
    .nullish()
    .transform((v) => {
      const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? ""));
      return Number.isFinite(n) ? n : null;
    }),
  description: text,
  uom: nullableText,
  qty: z
    .union([z.string(), z.number(), z.null()])
    .nullish()
    .transform((v) => {
      const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? "").replace(/,/g, ""));
      return Number.isFinite(n) && n > 0 ? n : 1;
    }),
  /** Every original cell of the row, indexed by column. Buyer columns are replayed as-is. */
  cells: z.array(cellSchema).default([]),
  supplier: fairmarkitSupplierSchema.default(FAIRMARKIT_DEFAULT_ANSWER),
  delivery_days: z
    .union([z.string(), z.number(), z.null()])
    .nullish()
    .transform((v) => {
      const n = typeof v === "number" ? v : Number.parseFloat(String(v ?? ""));
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
    }),
});
export type FairmarkitLine = z.infer<typeof fairmarkitLineSchema>;

export const fairmarkitSourceSchema = z.object({
  version: z.literal(1).default(1),
  file_name: nullableText,
  sheet_name: nullableText,
  imported_at: z.string().default(() => new Date().toISOString()),
  headers: z.array(z.string()).min(1),
  /** Rows above the header row, replayed verbatim apart from the quote block. */
  top: z.array(z.array(cellSchema)).default([]),
  meta: fairmarkitMetaSchema,
  lines: z.array(fairmarkitLineSchema),
});
export type FairmarkitSource = z.infer<typeof fairmarkitSourceSchema>;

/** Parse a value that may arrive as a JSON string from a form field. */
export const fairmarkitSourceField = z.preprocess((value) => {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed === null ? null : parsed;
    } catch {
      return null;
    }
  }
  return value;
}, fairmarkitSourceSchema.nullable());
