/**
 * Minimal XML helpers for the OOXML (xlsx) reader/writer.
 *
 * Scope is deliberately small: spreadsheet parts are machine-generated and the
 * elements we touch (`row`, `c`, `si`, `xf`, …) never nest inside themselves, so
 * a scanner built on non-greedy regexes is safe and keeps us free of a heavy
 * XML dependency.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

export function decodeXml(value: string): string {
  if (!value.includes("&")) return value;
  return value.replace(
    /&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g,
    (match, entity: string) => {
      if (entity.startsWith("#")) {
        const code =
          entity[1] === "x" || entity[1] === "X"
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10);
        if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      return NAMED_ENTITIES[entity] ?? match;
    },
  );
}

/** Escape text for an element body. */
export function escapeXml(value: string): string {
  return value.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

/** Escape text for a double-quoted attribute value. */
export function escapeAttr(value: string): string {
  return escapeXml(value).replace(/"/g, "&quot;");
}

/** Characters XML 1.0 forbids outright, plus the two non-characters. */
const XML_INVALID_CHARS = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]",
  "g",
);

/**
 * Strip characters XML 1.0 cannot represent, so a stray control character
 * pasted into a description can never produce a corrupt workbook.
 */
export function sanitizeXmlText(value: string): string {
  return value.replace(XML_INVALID_CHARS, "");
}

/** Parse the attributes out of a start tag's attribute text. */
export function parseAttrs(attrText: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrText)) !== null) {
    out[m[1]] = decodeXml(m[2] ?? m[3] ?? "");
  }
  return out;
}

/**
 * Visit every `<name …>inner</name>` (and `<name …/>`) element in `xml`.
 * `attrText` is the raw attribute string; `inner` is "" for self-closing tags.
 */
export function eachElement(
  xml: string,
  name: string,
  visit: (attrText: string, inner: string) => void,
): void {
  const re = new RegExp(`<${name}(\\s[^>]*?)?\\s*(?:/>|>([\\s\\S]*?)</${name}\\s*>)`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    visit(m[1] ?? "", m[2] ?? "");
  }
}

/** Concatenate the text of every `<t>` descendant (rich-text runs included). */
export function collectText(xml: string): string {
  let out = "";
  eachElement(xml, "t", (_attrText, inner) => {
    out += decodeXml(inner);
  });
  return out;
}
