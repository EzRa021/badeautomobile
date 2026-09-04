/**
 * Convert an amount to words in the Nigerian/British style used on the templates,
 * e.g. 618125 -> "Six Hundred and Eighteen Thousand, One Hundred and Twenty-Five Naira Only".
 * Kobo (the 2 decimals) are included only when non-zero.
 */

const ONES = [
  "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

/** Words for 0-999, British style: "One Hundred and Twenty-Five". */
function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);

  let restWords = "";
  if (rest > 0) {
    if (rest < 20) {
      restWords = ONES[rest];
    } else {
      const t = Math.floor(rest / 10);
      const o = rest % 10;
      restWords = TENS[t] + (o > 0 ? `-${ONES[o]}` : "");
    }
  }
  if (hundreds > 0 && restWords) return `${parts[0]} and ${restWords}`;
  if (restWords) return restWords;
  return parts.join("");
}

/** Whole-number to words. */
function integerToWords(value: number): string {
  if (value === 0) return "Zero";
  const groups: number[] = [];
  let n = Math.floor(value);
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const chunks: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const scale = SCALES[i] ? ` ${SCALES[i]}` : "";
    chunks.push(`${threeDigitsToWords(g)}${scale}`);
  }
  // Groups are separated by ", " as on the invoice template.
  return chunks.join(", ");
}

export interface AmountWordsOptions {
  uppercase?: boolean;
  currency?: string; // default "Naira"
  fraction?: string; // default "Kobo"
}

/** Full amount-in-words with currency and "Only", matching the templates. */
export function amountToWords(
  amount: number | string | null | undefined,
  opts: AmountWordsOptions = {},
): string {
  const { uppercase = false, currency = "Naira", fraction = "Kobo" } = opts;
  const n = typeof amount === "number" ? amount : parseFloat(String(amount ?? "0").replace(/,/g, ""));
  const safe = Number.isFinite(n) ? Math.abs(n) : 0;

  const naira = Math.floor(safe);
  const kobo = Math.round((safe - naira) * 100);

  let words = `${integerToWords(naira)} ${currency}`;
  if (kobo > 0) {
    words += `, ${integerToWords(kobo)} ${fraction}`;
  }
  words += " Only";

  return uppercase ? words.toUpperCase() : words;
}
