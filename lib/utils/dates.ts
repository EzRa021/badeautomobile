import { format, parseISO } from "date-fns";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : parseISO(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "13/08/2026" — the day/month/year format used on the templates. */
export function formatDocDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy") : "";
}

/** "22nd July, 2026" — the long ordinal format used on the quotation. */
export function formatLongOrdinalDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "do MMMM, yyyy") : "";
}

/** "15/07/2026, 2:30pm" — date + time as on the job-delivery report. */
export function formatDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd/MM/yyyy, h:mmaaa") : "";
}

/** "13 Aug 2026" — compact display for list/detail UI. */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "dd MMM yyyy") : "—";
}

/** "yyyy-MM-dd" for date inputs. */
export function toDateInputValue(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "yyyy-MM-dd") : "";
}

/** "yyyy-MM-ddTHH:mm" for datetime-local inputs. */
export function toDateTimeInputValue(value: string | Date | null | undefined): string {
  const d = toDate(value);
  return d ? format(d, "yyyy-MM-dd'T'HH:mm") : "";
}
