import { strToU8, zipSync } from "fflate";
import { columnLetter } from "./read";
import { escapeAttr, escapeXml, sanitizeXmlText } from "./xml";

/**
 * A cell to write. `kind` mirrors the shapes Fairmarkit's own export uses:
 * text goes out as `t="str"` and numbers as bare `<v>`, so a round-tripped
 * workbook is structurally identical to one downloaded from their site.
 */
export interface XlsxCell {
  value: string | number | null;
  kind?: "text" | "number";
  bold?: boolean;
}

export type XlsxCellInput = XlsxCell | string | number | null | undefined;

export interface XlsxColumn {
  /** Width in characters, as Excel measures it. */
  width: number;
}

export interface WriteWorkbookOptions {
  sheetName?: string;
  columns?: XlsxColumn[];
  rows: XlsxCellInput[][];
}

const STYLE_NORMAL = 0;
const STYLE_BOLD = 1;

function toCell(input: XlsxCellInput): XlsxCell | null {
  if (input == null) return null;
  if (typeof input === "string" || typeof input === "number") return { value: input };
  return input;
}

function renderCell(cell: XlsxCell, ref: string): string {
  const style = cell.bold ? STYLE_BOLD : STYLE_NORMAL;
  const styleAttr = style === STYLE_NORMAL ? "" : ` s="${style}"`;

  const numeric =
    cell.kind === "number" ||
    (cell.kind !== "text" && typeof cell.value === "number");

  if (numeric) {
    const n = typeof cell.value === "number" ? cell.value : Number(cell.value);
    // A non-finite number has no valid cell representation — fall back to text.
    if (Number.isFinite(n)) {
      return `<c r="${ref}"${styleAttr}><v>${n}</v></c>`;
    }
  }

  const text = sanitizeXmlText(cell.value == null ? "" : String(cell.value));
  const preserve = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : "";
  return `<c r="${ref}"${styleAttr} t="str"><v${preserve}>${escapeXml(text)}</v></c>`;
}

function renderSheet(options: WriteWorkbookOptions): string {
  const { rows, columns } = options;
  const width = Math.max(
    columns?.length ?? 0,
    rows.reduce((max, row) => Math.max(max, row.length), 0),
  );
  const dimension = `A1:${columnLetter(Math.max(width, 1) - 1)}${Math.max(rows.length, 1)}`;

  const cols = columns?.length
    ? `<cols>${columns
        .map(
          (c, i) =>
            `<col min="${i + 1}" max="${i + 1}" width="${c.width}" customWidth="1"/>`,
        )
        .join("")}</cols>`
    : "";

  const body = rows
    .map((row, r) => {
      const cells = row
        .map((input, c) => {
          const cell = toCell(input);
          if (cell == null) return "";
          return renderCell(cell, `${columnLetter(c)}${r + 1}`);
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="${dimension}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${body}</sheetData></worksheet>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

// Excel repairs the file unless fill 0 is "none" and fill 1 is "gray125".
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

/** ZIP entries cannot predate 1980, so pin every part to that instant. */
const ZIP_EPOCH = Date.UTC(1980, 0, 1);

/** Excel limits sheet names to 31 characters and forbids `[]:*?/\`. */
function safeSheetName(name: string): string {
  const cleaned = sanitizeXmlText(name).replace(/[[\]:*?/\\]/g, " ").trim();
  return (cleaned || "Sheet1").slice(0, 31);
}

/** Build a single-sheet .xlsx file from a grid of cells. */
export function writeWorkbook(options: WriteWorkbookOptions): Uint8Array {
  const sheetName = safeSheetName(options.sheetName ?? "Sheet1");
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeAttr(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  return zipSync(
    {
      "[Content_Types].xml": strToU8(CONTENT_TYPES),
      "_rels/.rels": strToU8(ROOT_RELS),
      "xl/workbook.xml": strToU8(workbook),
      "xl/_rels/workbook.xml.rels": strToU8(WORKBOOK_RELS),
      "xl/styles.xml": strToU8(STYLES),
      "xl/worksheets/sheet1.xml": strToU8(renderSheet(options)),
    },
    // A fixed timestamp keeps the output byte-stable; ZIP only allows 1980-2099.
    { level: 6, mtime: ZIP_EPOCH },
  );
}
