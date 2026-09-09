/** Vehicle text helpers shared by the forms and the RFQ importer. */

/**
 * Nigerian civilian plates read as three letters, two or three digits, then two
 * or three letters — "LSD 656 HD", "KSF 318 FJ", "AGL 58EW" — with the spacing
 * written inconsistently.
 */
const PLATE = /\b([A-Z]{2,3})[\s-]?(\d{2,4})[\s-]?([A-Z]{2,3})\b/;

/** Words that end a vehicle name when scanning backwards from the plate. */
const STOP_WORDS = new Set([
  "rfq", "rfp", "for", "of", "on", "the", "and", "a", "an", "to",
  "repair", "repairs", "repairing", "service", "servicing", "maintenance",
  "request", "quote", "quotation", "supply", "fix", "fixing", "job", "works", "work",
]);

export interface ExtractedVehicle {
  /** e.g. "Toyota Prado" */
  label: string | null;
  /** e.g. "LSD 656 HD" */
  reg_no: string | null;
}

/**
 * Pull a vehicle and its plate out of a free-text job title, e.g.
 * "RFQ For Repair Of Toyota Prado LSD 656 HD @Flowergate Factory"
 * → `{ label: "Toyota Prado", reg_no: "LSD 656 HD" }`.
 *
 * The plate is returned in a canonical "AAA 000 XX" spacing regardless of how it
 * was written ("AGL 58EW" → "AGL 58 EW"); registry matching ignores spacing, so
 * this only affects display.
 *
 * Returns nulls rather than guessing when there is no plate to anchor on.
 */
export function extractVehicleFromTitle(title: string | null | undefined): ExtractedVehicle {
  const text = String(title ?? "").trim();
  if (!text) return { label: null, reg_no: null };

  const match = text.match(PLATE);
  if (!match || match.index == null) return { label: null, reg_no: null };

  const reg_no = `${match[1]} ${match[2]} ${match[3]}`.toUpperCase();

  // Walk backwards from the plate, collecting up to four descriptive words.
  const words = text.slice(0, match.index).trim().split(/\s+/);
  const name: string[] = [];
  for (let i = words.length - 1; i >= 0 && name.length < 4; i--) {
    const word = words[i].replace(/[^\p{L}\p{N}-]/gu, "");
    if (!word) continue;
    if (STOP_WORDS.has(word.toLowerCase())) break;
    name.unshift(word);
  }

  return { label: name.join(" ") || null, reg_no };
}

/** "LSD 656 HD" / "lsd-656hd" → "LSD656HD". Mirrors `vehicles.reg_no_key`. */
export function normalizePlate(value: string | null | undefined): string {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "Toyota Prado · LSD 656 HD" for list rows and history headers. */
export function vehicleDisplayName(
  description: string | null | undefined,
  regNo?: string | null,
): string {
  const parts = [description?.trim(), regNo?.trim()].filter(Boolean);
  return parts.join(" · ") || "Unknown vehicle";
}
