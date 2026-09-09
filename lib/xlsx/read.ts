import { strFromU8, unzipSync } from "fflate";
import { collectText, decodeXml, eachElement, parseAttrs } from "./xml";

export type CellValue = string | number | boolean | null;

export interface XlsxSheet {
  name: string;
  /** Dense, 0-based grid. Short rows are padded with `null`. */
  rows: CellValue[][];
}

/** "BC" → 54 (0-based). */
export function columnIndex(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    const code = ch.charCodeAt(0) - 64; // A → 1
    if (code < 1 || code > 26) return n - 1;
    n = n * 26 + code;
  }
  return n - 1;
}

/** 0 → "A", 26 → "AA". */
export function columnLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

// ------------------------------------------------------------------- styles
/** Built-in number-format ids that render as a date and/or time. */
const BUILTIN_DATE_FORMATS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);

function isDateFormatCode(code: string): boolean {
  // Drop escaped characters, literals and colour/condition blocks before
  // looking for date tokens, so formats like [Red]#,##0.00" days" stay numeric.
  const stripped = code
    .replace(/\\./g, "")
    .replace(/"[^"]*"/g, "")
    .replace(/\[[^\]]*\]/g, "");
  return /[ymdhs]/i.test(stripped);
}

/** Map each cellXf index to whether it formats its value as a date. */
function readDateStyles(stylesXml: string | null): boolean[] {
  if (!stylesXml) return [];
  const custom = new Map<number, string>();
  eachElement(stylesXml, "numFmt", (attrText) => {
    const a = parseAttrs(attrText);
    const id = Number.parseInt(a.numFmtId ?? "", 10);
    if (Number.isFinite(id)) custom.set(id, a.formatCode ?? "");
  });

  const out: boolean[] = [];
  const cellXfs = stylesXml.match(/<cellXfs[\s\S]*?<\/cellXfs>/);
  if (!cellXfs) return out;
  eachElement(cellXfs[0], "xf", (attrText) => {
    const id = Number.parseInt(parseAttrs(attrText).numFmtId ?? "0", 10);
    const code = custom.get(id);
    out.push(code != null ? isDateFormatCode(code) : BUILTIN_DATE_FORMATS.has(id));
  });
  return out;
}

// -------------------------------------------------------------------- dates
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30); // accounts for the 1900 leap-year bug

/** Render an Excel date serial as "MM/DD/YYYY" (the format Fairmarkit expects). */
export function serialToDateString(serial: number): string {
  const ms = EXCEL_EPOCH_UTC + Math.round(serial * 86400000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return String(serial);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getUTCFullYear()}`;
}

// ----------------------------------------------------------------- workbook
function readSharedStrings(xml: string | null): string[] {
  if (!xml) return [];
  const out: string[] = [];
  eachElement(xml, "si", (_attrText, inner) => {
    out.push(collectText(inner));
  });
  return out;
}

/** Resolve a relationship target against the part's own directory. */
function resolveTarget(baseDir: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const parts = `${baseDir}/${target}`.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function parseSheetXml(xml: string, shared: string[], dateStyles: boolean[]): CellValue[][] {
  const rows: CellValue[][] = [];
  const body = xml.match(/<sheetData[\s\S]*?<\/sheetData>/)?.[0] ?? xml;

  eachElement(body, "row", (rowAttrText, rowInner) => {
    const rowNumber = Number.parseInt(parseAttrs(rowAttrText).r ?? "", 10);
    const cells: CellValue[] = [];
    let cursor = 0; // fallback column when a cell omits its reference

    eachElement(rowInner, "c", (cellAttrText, cellInner) => {
      const a = parseAttrs(cellAttrText);
      const ref = a.r ?? "";
      const col = ref ? columnIndex(ref.replace(/[0-9]+$/, "")) : cursor;
      cursor = col + 1;

      const type = a.t ?? "n";
      let value: CellValue = null;

      if (type === "inlineStr") {
        value = collectText(cellInner);
      } else {
        const raw = cellInner.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1];
        if (raw != null) {
          const text = decodeXml(raw);
          if (type === "s") {
            value = shared[Number.parseInt(text, 10)] ?? "";
          } else if (type === "str" || type === "d") {
            value = text;
          } else if (type === "b") {
            value = text === "1";
          } else if (type === "e") {
            value = "";
          } else {
            const n = Number(text);
            if (Number.isFinite(n)) {
              const styleIndex = Number.parseInt(a.s ?? "", 10);
              value = dateStyles[styleIndex] ? serialToDateString(n) : n;
            } else {
              value = text;
            }
          }
        }
      }

      while (cells.length < col) cells.push(null);
      cells[col] = value;
    });

    const index = Number.isFinite(rowNumber) ? rowNumber - 1 : rows.length;
    while (rows.length < index) rows.push([]);
    rows[index] = cells;
  });

  const width = rows.reduce((max, r) => Math.max(max, r.length), 0);
  return rows.map((r) => {
    const padded = r.slice();
    while (padded.length < width) padded.push(null);
    return padded;
  });
}

/** Read every worksheet of an .xlsx file into a plain grid of values. */
export function readWorkbook(data: Uint8Array): XlsxSheet[] {
  const files = unzipSync(data);
  const text = (path: string): string | null =>
    files[path] ? strFromU8(files[path]) : null;

  const workbookPath = files["xl/workbook.xml"] ? "xl/workbook.xml" : null;
  if (!workbookPath) throw new Error("Not a workbook: xl/workbook.xml is missing.");
  const workbookXml = text(workbookPath)!;
  const baseDir = workbookPath.split("/").slice(0, -1).join("/");

  const rels = new Map<string, string>();
  const relsXml = text(`${baseDir}/_rels/workbook.xml.rels`);
  if (relsXml) {
    eachElement(relsXml, "Relationship", (attrText) => {
      const a = parseAttrs(attrText);
      if (a.Id && a.Target) rels.set(a.Id, resolveTarget(baseDir, a.Target));
    });
  }

  const shared = readSharedStrings(text(`${baseDir}/sharedStrings.xml`));
  const dateStyles = readDateStyles(text(`${baseDir}/styles.xml`));

  const sheets: XlsxSheet[] = [];
  const sheetsBlock = workbookXml.match(/<sheets[\s\S]*?<\/sheets>/)?.[0] ?? "";
  let ordinal = 0;
  eachElement(sheetsBlock, "sheet", (attrText) => {
    const a = parseAttrs(attrText);
    ordinal += 1;
    const rid = a["r:id"] ?? a["relationships:id"] ?? a.id;
    const path = (rid && rels.get(rid)) || `${baseDir}/worksheets/sheet${ordinal}.xml`;
    const sheetXml = text(path);
    if (!sheetXml) return;
    sheets.push({
      name: a.name ?? `Sheet${ordinal}`,
      rows: parseSheetXml(sheetXml, shared, dateStyles),
    });
  });

  return sheets;
}

/** Convenience: the first worksheet, or `null` when the file has none. */
export function readFirstSheet(data: Uint8Array): XlsxSheet | null {
  return readWorkbook(data)[0] ?? null;
}
