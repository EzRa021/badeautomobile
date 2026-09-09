import { readFirstSheet, type CellValue } from "@/lib/xlsx/read";
import {
  classifyHeaders,
  fairmarkitSourceSchema,
  FAIRMARKIT_DEFAULT_CURRENCY,
  FAIRMARKIT_DEFAULT_DELIVERY_DAYS,
  FAIRMARKIT_DEFAULT_VALID_DAYS,
  FAIRMARKIT_NIL,
  normalizeLabel,
  type FairmarkitLine,
  type FairmarkitRole,
  type FairmarkitSource,
} from "./schema";

export class FairmarkitParseError extends Error {}

export interface FairmarkitImportedItem {
  description: string;
  qty: number;
  unit: string;
}

export interface FairmarkitImport {
  source: FairmarkitSource;
  items: FairmarkitImportedItem[];
  /** The buyer, ready to drop into the quotation's customer field. */
  customer_name: string | null;
  /** The RFQ title, ready to drop into the quotation's job-title banner. */
  job_title: string | null;
}

function asText(value: CellValue): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).trim();
}

function asNumber(value: CellValue): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const n = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function trimTrailing(row: CellValue[]): CellValue[] {
  const out = row.slice();
  while (out.length > 0 && asText(out[out.length - 1]) === "") out.pop();
  return out;
}

/** Locate the "Line #  |  Item / Service description  |  …" header row. */
function findHeaderRow(rows: CellValue[][]): number {
  for (let r = 0; r < rows.length; r++) {
    const roles = new Set(classifyHeaders(rows[r].map(asText)));
    if (roles.has("description") && (roles.has("line_no") || roles.has("qty"))) return r;
  }
  return -1;
}

/**
 * Read a labelled value out of the block above the item table. Fairmarkit
 * writes these two ways: inline ("RFQ ID: 3058650") and as a label cell with
 * the value in the cell beside it ("Quote Number" | "BAD/00012/755").
 */
function readLabelled(top: CellValue[][], label: string): string | null {
  const wanted = normalizeLabel(label);
  for (const row of top) {
    for (let c = 0; c < row.length; c++) {
      const raw = asText(row[c]);
      if (!raw) continue;

      const colon = raw.indexOf(":");
      if (colon > -1 && normalizeLabel(raw.slice(0, colon)) === wanted) {
        const inline = raw.slice(colon + 1).trim();
        if (inline) return inline;
      }

      if (normalizeLabel(raw) === wanted) {
        for (let n = c + 1; n < row.length; n++) {
          const next = asText(row[n]);
          if (next) return next;
        }
      }
    }
  }
  return null;
}

/** Pull "Nestle" out of "Nestle RFQ details" (and the supplier out of its twin). */
function readSuffixed(top: CellValue[][], suffix: RegExp): string | null {
  for (const row of top) {
    for (const cell of row) {
      const raw = asText(cell);
      const m = raw.match(suffix);
      if (m && m[1].trim()) return m[1].trim();
    }
  }
  return null;
}

/**
 * Parse a Fairmarkit "import" workbook (the sheet a supplier downloads from a
 * bid request) into the quotation fields plus everything needed to rebuild the
 * same sheet on export.
 */
export function parseFairmarkitWorkbook(
  data: Uint8Array,
  fileName?: string | null,
): FairmarkitImport {
  let sheet;
  try {
    sheet = readFirstSheet(data);
  } catch {
    throw new FairmarkitParseError("That file isn't a readable Excel (.xlsx) workbook.");
  }
  if (!sheet || sheet.rows.length === 0) {
    throw new FairmarkitParseError("That workbook is empty.");
  }

  const headerRow = findHeaderRow(sheet.rows);
  if (headerRow === -1) {
    throw new FairmarkitParseError(
      "This doesn't look like a Fairmarkit bid sheet — no “Line #” / “Item / Service description” header row was found.",
    );
  }

  const headers = trimTrailing(sheet.rows[headerRow]).map(asText);
  const roles = classifyHeaders(headers);
  const roleIndex = (role: FairmarkitRole): number => roles.indexOf(role);

  const descriptionCol = roleIndex("description");
  const qtyCol = roleIndex("qty");
  const uomCol = roleIndex("uom");
  const lineNoCol = roleIndex("line_no");
  const deliveryCol = roleIndex("delivery_days");
  const manufacturerCol = roleIndex("supplier_manufacturer");
  const mfgPartCol = roleIndex("supplier_mfg_part");
  const supplierPartCol = roleIndex("supplier_part");
  const skuCol = roleIndex("supplier_sku");
  const countryCol = roleIndex("country_of_origin");
  const minQtyCol = roleIndex("min_order_qty");
  const supplierCommentsCol = roleIndex("supplier_comments");

  const top = sheet.rows.slice(0, headerRow).map(trimTrailing);

  const at = (row: CellValue[], col: number): CellValue => (col < 0 ? null : row[col] ?? null);
  /** Keep an imported answer if the buyer's sheet already carried one. */
  const keepOr = (row: CellValue[], col: number, fallback: string): string =>
    asText(at(row, col)) || fallback;

  const lines: FairmarkitLine[] = [];
  for (let r = headerRow + 1; r < sheet.rows.length; r++) {
    const row = sheet.rows[r];
    const description = asText(at(row, descriptionCol));
    const lineNo = asNumber(at(row, lineNoCol));
    if (!description && lineNo == null) continue;

    lines.push({
      line_no: lineNo,
      description,
      uom: asText(at(row, uomCol)) || null,
      qty: asNumber(at(row, qtyCol)) ?? 1,
      cells: trimTrailing(row.slice(0, headers.length)),
      supplier: {
        manufacturer: keepOr(row, manufacturerCol, FAIRMARKIT_NIL),
        mfg_part: keepOr(row, mfgPartCol, FAIRMARKIT_NIL),
        part: keepOr(row, supplierPartCol, FAIRMARKIT_NIL),
        sku: asText(at(row, skuCol)),
        country_of_origin: asText(at(row, countryCol)),
        min_order_qty: asText(at(row, minQtyCol)),
        comments: asText(at(row, supplierCommentsCol)),
      },
      delivery_days: (() => {
        const n = asNumber(at(row, deliveryCol));
        return n != null && n >= 0 ? Math.round(n) : null;
      })(),
    });
  }

  if (lines.length === 0) {
    throw new FairmarkitParseError("No line items were found under the header row.");
  }

  const deliveryDays =
    lines.find((l) => l.delivery_days != null)?.delivery_days ?? FAIRMARKIT_DEFAULT_DELIVERY_DAYS;

  const title = readLabelled(top, "TITLE");
  const source = fairmarkitSourceSchema.parse({
    version: 1,
    file_name: fileName ?? null,
    sheet_name: sheet.name,
    imported_at: new Date().toISOString(),
    headers,
    top,
    meta: {
      buyer_name: readSuffixed(top, /^(.*?)\s+RFQ\s+details$/i),
      supplier_name: readSuffixed(top, /^(.*?)\s+RFQ\s+Response$/i),
      title,
      rfq_id: readLabelled(top, "RFQ ID"),
      scheduled_close: readLabelled(top, "Scheduled Close Date"),
      shipping_method: readLabelled(top, "Shipping Method"),
      shipping_address: readLabelled(top, "Shipping address"),
      preferred_delivery_date: readLabelled(top, "Preferred Delivery Date"),
      quote_number: readLabelled(top, "Quote Number"),
      valid_days: readLabelled(top, "Valid For days") ?? FAIRMARKIT_DEFAULT_VALID_DAYS,
      currency: readLabelled(top, "Currency") ?? FAIRMARKIT_DEFAULT_CURRENCY,
      delivery_days: deliveryDays,
    },
    lines,
  });

  return {
    source,
    items: source.lines.map((line) => ({
      description: line.description,
      qty: line.qty,
      unit: line.uom ?? "",
    })),
    customer_name: source.meta.buyer_name,
    job_title: source.meta.title,
  };
}
