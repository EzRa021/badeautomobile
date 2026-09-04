import { getDocumentProxy } from "unpdf";

export interface ParsedPoItem {
  item_code: string;
  description: string;
  qty: number;
  unit_price: number;
}

export interface ParsedPo {
  po_no: string | null;
  customer_name: string | null;
  customer_address: string | null;
  vat_rate: number;
  items: ParsedPoItem[];
}

function toNumber(s: string): number {
  const n = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Reconstruct visual lines from a PDF page's positioned text items. */
async function pageLines(pdf: Awaited<ReturnType<typeof getDocumentProxy>>, pageNum: number): Promise<string[]> {
  const page = await pdf.getPage(pageNum);
  const content = await page.getTextContent();
  const rows = new Map<number, { x: number; s: string }[]>();
  for (const it of content.items as { str: string; transform: number[] }[]) {
    if (!it.str || !it.str.trim()) continue;
    const x = it.transform[4];
    const y = Math.round(it.transform[5]);
    let key: number | null = null;
    for (const k of rows.keys()) {
      if (Math.abs(k - y) <= 2) {
        key = k;
        break;
      }
    }
    if (key === null) {
      key = y;
      rows.set(key, []);
    }
    rows.get(key)!.push({ x, s: it.str });
  }
  return [...rows.keys()]
    .sort((a, b) => b - a) // top → bottom
    .map((y) =>
      rows
        .get(y)!
        .sort((a, b) => a.x - b.x)
        .map((o) => o.s)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    );
}

/**
 * Parse a Nestlé (SAP-style) Purchase Order PDF into the fields needed to
 * pre-fill a Bade invoice. Text-based PDFs only (not scans).
 */
export async function parseNestlePo(data: Uint8Array): Promise<ParsedPo> {
  const pdf = await getDocumentProxy(data);
  const maxPages = Math.min(pdf.numPages, 6);
  const lines: string[] = [];
  for (let p = 1; p <= maxPages; p++) {
    lines.push(...(await pageLines(pdf, p)));
  }

  const all = lines.join("\n");

  const poMatch = all.match(/Purchase order\s*:?\s*(\d{6,})/i);
  const po_no = poMatch ? poMatch[1] : null;

  // Items: header line "<item#> <materialNo> <description>" followed by a
  // "<qty> <unit> <unitPrice> <netValue>" line.
  const items: (ParsedPoItem & { _line: number })[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\d{1,3})\s+(\d{6,})\s+(.+)$/);
    if (!m) continue;
    const q = (lines[i + 1] ?? "").match(
      /^([\d,]+(?:\.\d+)?)\s+([A-Za-z]+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/,
    );
    if (!q) continue;
    items.push({
      item_code: m[2],
      description: m[3].trim(),
      qty: toNumber(q[1]),
      unit_price: toNumber(q[3]),
      _line: i,
    });
  }

  // A PO row truncates long descriptions; the full text repeats on a separator
  // line (mostly underscores). Prefer the fuller version.
  for (let k = 0; k < items.length; k++) {
    const it = items[k];
    const end = k + 1 < items.length ? items[k + 1]._line : Math.min(it._line + 8, lines.length);
    const prefix = it.description.slice(0, 8).toUpperCase();
    for (let j = it._line + 2; j < end; j++) {
      const cand = lines[j].replace(/_/g, " ").replace(/\s+/g, " ").trim();
      if (cand.length > it.description.length && cand.toUpperCase().startsWith(prefix)) {
        it.description = cand;
        break;
      }
    }
  }

  // Customer (the PO is issued by the customer). Address from the "Invoice To"
  // block where present.
  const customer_name = /Nestle\s+Nigeria\s+Plc/i.test(all) ? "Nestle Nigeria Plc" : null;
  let customer_address: string | null = null;
  const invIdx = lines.findIndex((l) => /invoice\s*to\s*:?/i.test(l));
  if (invIdx >= 0) {
    const addr: string[] = [];
    for (let j = invIdx; j < Math.min(invIdx + 7, lines.length); j++) {
      let l = lines[j].replace(/invoice\s*to\s*:?/i, "").trim();
      if (/^(deliver\s*to|terms|currency|our reference)/i.test(l)) break;
      if (/nestle\s+nigeria\s+plc/i.test(l)) continue; // that's the name
      if (l) addr.push(l);
    }
    if (addr.length) customer_address = addr.slice(0, 4).join("\n");
  }

  return {
    po_no,
    customer_name,
    customer_address,
    vat_rate: 7.5,
    items: items.map(({ item_code, description, qty, unit_price }) => ({
      item_code,
      description,
      qty,
      unit_price,
    })),
  };
}
