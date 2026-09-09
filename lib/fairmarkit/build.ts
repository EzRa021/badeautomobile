import type { CellValue } from "@/lib/xlsx/read";
import { writeWorkbook, type XlsxCellInput } from "@/lib/xlsx/write";
import type { Quotation, QuotationItem } from "@/lib/types";
import {
  classifyHeaders,
  fairmarkitSourceSchema,
  FAIRMARKIT_COLUMN_WIDTHS,
  FAIRMARKIT_DEFAULT_ANSWER,
  FAIRMARKIT_DEFAULT_CURRENCY,
  FAIRMARKIT_DEFAULT_DELIVERY_DAYS,
  FAIRMARKIT_DEFAULT_VALID_DAYS,
  FAIRMARKIT_HEADERS,
  FAIRMARKIT_NIL,
  FAIRMARKIT_PRICE_DECIMALS,
  normalizeLabel,
  type FairmarkitLine,
  type FairmarkitSource,
} from "./schema";

/** A Fairmarkit line paired with the quotation item that prices it. */
export interface FairmarkitMatch {
  line: FairmarkitLine;
  item: QuotationItem | null;
  unitPrice: number | null;
}

export interface FairmarkitExportPlan {
  source: FairmarkitSource;
  matches: FairmarkitMatch[];
  /** Quotation items with no Fairmarkit line to sit on — Fairmarkit ignores extra rows. */
  unmatchedItems: QuotationItem[];
  bidCount: number;
}

function normalizeDescription(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Unit price for a line: the stated rate when it reconciles, else derived. */
function unitPriceFor(line: FairmarkitLine, item: QuotationItem): number {
  const qty = line.qty > 0 ? line.qty : 1;
  const amount = Number(item.amount) || 0;
  const rate = item.rate == null ? null : Number(item.rate);
  if (rate != null && Number.isFinite(rate) && Math.abs(rate * qty - amount) < 0.005) {
    return rate;
  }
  return amount / qty;
}

/**
 * Pair each Fairmarkit line with a quotation item: first by description, then
 * positionally for whatever is left, so a renamed line still finds its price.
 */
export function planFairmarkitExport(
  source: FairmarkitSource,
  items: QuotationItem[],
): FairmarkitExportPlan {
  const used = new Set<number>();
  const matched: (QuotationItem | null)[] = source.lines.map(() => null);

  source.lines.forEach((line, i) => {
    const key = normalizeDescription(line.description);
    if (!key) return;
    const found = items.findIndex(
      (item, j) => !used.has(j) && normalizeDescription(item.description) === key,
    );
    if (found > -1) {
      used.add(found);
      matched[i] = items[found];
    }
  });

  source.lines.forEach((_line, i) => {
    if (matched[i]) return;
    if (i < items.length && !used.has(i)) {
      used.add(i);
      matched[i] = items[i];
      return;
    }
    const next = items.findIndex((_item, j) => !used.has(j));
    if (next > -1) {
      used.add(next);
      matched[i] = items[next];
    }
  });

  const matches: FairmarkitMatch[] = source.lines.map((line, i) => {
    const item = matched[i];
    return { line, item, unitPrice: item ? unitPriceFor(line, item) : null };
  });

  return {
    source,
    matches,
    unmatchedItems: items.filter((_item, j) => !used.has(j)),
    bidCount: matches.filter((m) => m.unitPrice != null && m.unitPrice > 0).length,
  };
}

/** Replace the value cell that sits beside a label in the header block. */
function setLabelledValue(top: CellValue[][], label: string, value: CellValue): boolean {
  const wanted = normalizeLabel(label);
  for (const row of top) {
    for (let c = 0; c < row.length; c++) {
      if (normalizeLabel(row[c]) !== wanted) continue;
      row[c + 1] = value;
      return true;
    }
  }
  return false;
}

/** Build a Fairmarkit-shaped sheet for a quotation that was never imported. */
export function synthesizeSource(
  quotation: Quotation,
  items: QuotationItem[],
  supplierName: string | null,
): FairmarkitSource {
  const headers = [...FAIRMARKIT_HEADERS];
  const width = headers.length;
  const blank = (): CellValue[] => new Array<CellValue>(width).fill(null);

  const row1 = blank();
  row1[0] = `${quotation.customer_name} RFQ details`;
  row1[13] = `${supplierName ?? "Supplier"} RFQ Response`;

  const row2 = blank();
  row2[0] = `TITLE: ${quotation.job_title ?? quotation.ref_no}`;
  row2[13] = "Quote Number";
  row2[14] = quotation.ref_no;

  const row3 = blank();
  row3[0] = "RFQ ID: ";
  row3[13] = "Valid For days:";
  row3[14] = FAIRMARKIT_DEFAULT_VALID_DAYS;

  const row4 = blank();
  row4[0] = "Scheduled Close Date: ";
  row4[13] = "Currency:";
  row4[14] = FAIRMARKIT_DEFAULT_CURRENCY;

  const row5 = blank();
  row5[0] = "Shipping Method: ";
  const row6 = blank();
  row6[0] = `Shipping address: ${quotation.customer_address ?? ""}`.trim();
  const row7 = blank();
  row7[0] = "Preferred Delivery Date: ";

  const lines: FairmarkitLine[] = items.map((item, i) => {
    const cells = blank();
    cells[0] = i + 1;
    cells[1] = "Item";
    cells[2] = item.description;
    cells[5] = item.unit ?? "";
    cells[11] = "No";
    cells[12] = Number(item.qty) || 1;
    return {
      line_no: i + 1,
      description: item.description,
      uom: item.unit ?? null,
      qty: Number(item.qty) > 0 ? Number(item.qty) : 1,
      cells,
      supplier: { ...FAIRMARKIT_DEFAULT_ANSWER },
      delivery_days: null,
    };
  });

  return fairmarkitSourceSchema.parse({
    version: 1,
    file_name: null,
    sheet_name: "RFQ",
    imported_at: new Date().toISOString(),
    headers,
    top: [row1, row2, row3, row4, row5, row6, row7, []],
    meta: {
      buyer_name: quotation.customer_name,
      supplier_name: supplierName,
      title: quotation.job_title,
      rfq_id: null,
      scheduled_close: null,
      shipping_method: null,
      shipping_address: quotation.customer_address,
      preferred_delivery_date: null,
      quote_number: quotation.ref_no,
      valid_days: FAIRMARKIT_DEFAULT_VALID_DAYS,
      currency: FAIRMARKIT_DEFAULT_CURRENCY,
      delivery_days: FAIRMARKIT_DEFAULT_DELIVERY_DAYS,
    },
    lines,
  });
}

function toCellInput(value: CellValue): XlsxCellInput {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return { value, kind: "text" };
}

/**
 * Render the workbook a supplier uploads back to Fairmarkit: the buyer's
 * columns replayed untouched, the supplier's columns filled from the quotation.
 */
export function buildFairmarkitWorkbook(
  plan: FairmarkitExportPlan,
  quotation: Quotation,
): Uint8Array {
  const { source, matches } = plan;
  const headers = source.headers;
  const roles = classifyHeaders(headers);
  const width = headers.length;

  // Replay the header block, refreshing the values the supplier controls.
  const top: CellValue[][] = source.top.map((row) => {
    const copy = row.slice();
    while (copy.length < width) copy.push(null);
    return copy;
  });
  setLabelledValue(top, "Quote Number", quotation.ref_no);
  setLabelledValue(top, "Valid For days", source.meta.valid_days);
  setLabelledValue(top, "Currency", source.meta.currency || FAIRMARKIT_DEFAULT_CURRENCY);

  const rows: XlsxCellInput[][] = top.map((row) => row.map(toCellInput));

  rows.push(headers.map((label) => ({ value: label, kind: "text" as const, bold: true })));

  const defaultDelivery = source.meta.delivery_days || FAIRMARKIT_DEFAULT_DELIVERY_DAYS;

  for (const match of matches) {
    const { line, unitPrice } = match;
    const bidding = unitPrice != null && unitPrice > 0;
    const answer = line.supplier;

    const row: XlsxCellInput[] = [];
    for (let c = 0; c < width; c++) {
      switch (roles[c]) {
        case "supplier_manufacturer":
          row.push({ value: answer.manufacturer || FAIRMARKIT_NIL, kind: "text" });
          break;
        case "supplier_mfg_part":
          row.push({ value: answer.mfg_part || FAIRMARKIT_NIL, kind: "text" });
          break;
        case "supplier_part":
          row.push({ value: answer.part || FAIRMARKIT_NIL, kind: "text" });
          break;
        case "bid":
          row.push({ value: bidding ? "Yes" : "No", kind: "text" });
          break;
        case "unit_price":
          row.push(
            bidding
              ? { value: unitPrice.toFixed(FAIRMARKIT_PRICE_DECIMALS), kind: "text" as const }
              : null,
          );
          break;
        case "delivery_days":
          row.push(bidding ? (line.delivery_days ?? defaultDelivery) : null);
          break;
        case "supplier_sku":
          row.push(toCellInput(answer.sku));
          break;
        case "country_of_origin":
          row.push(toCellInput(answer.country_of_origin));
          break;
        case "min_order_qty":
          row.push(toCellInput(answer.min_order_qty));
          break;
        case "supplier_comments":
          row.push(toCellInput(answer.comments));
          break;
        default:
          // Buyer column — replayed exactly as it arrived ("do not modify").
          row.push(toCellInput(line.cells[c] ?? null));
          break;
      }
    }
    rows.push(row);
  }

  return writeWorkbook({
    sheetName: source.sheet_name ?? "RFQ",
    columns: headers.map((_label, i) => ({
      width: FAIRMARKIT_COLUMN_WIDTHS[i] ?? 20,
    })),
    rows,
  });
}

/** "Fairmarkit-3058650-BAD_00012_755.xlsx" */
export function fairmarkitFileName(quotation: Quotation, source: FairmarkitSource): string {
  const parts = ["Fairmarkit", source.meta.rfq_id, quotation.ref_no].filter(Boolean);
  return `${parts.join("-").replace(/[^\w.-]+/g, "_")}.xlsx`;
}
