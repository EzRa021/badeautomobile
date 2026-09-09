import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/utils/money";
import {
  resolvePaging,
  resolveSort,
  toPaged,
  type ListOptions,
  type Paged,
  type ResolvedSort,
  type SortMap,
} from "./list";

/**
 * Per-vehicle service history.
 *
 * Every document type is linked to a vehicle (see migration 0004), so a
 * vehicle's whole story — what was quoted, what was invoiced, what parts were
 * bought and what work was actually delivered — can be assembled in one pass.
 */

export type VehicleDocKind = "quotation" | "invoice" | "purchase_order" | "job_delivery";

export const VEHICLE_DOC_KINDS: { value: VehicleDocKind; label: string; plural: string }[] = [
  { value: "quotation", label: "Quotation", plural: "Quotations" },
  { value: "job_delivery", label: "Job delivery", plural: "Job deliveries" },
  { value: "invoice", label: "Invoice", plural: "Invoices" },
  { value: "purchase_order", label: "Purchase order", plural: "Purchase orders" },
];

export interface VehicleDocument {
  kind: VehicleDocKind;
  id: string;
  ref: string;
  /** ISO date the document is filed under. */
  date: string;
  /** Customer, or supplier for a purchase order. */
  party: string | null;
  /** Job title / work done / PO reference — whatever describes the job. */
  summary: string | null;
  /** Null for job deliveries, which carry no money. */
  amount: number | null;
  status: string;
  href: string;
}

/** Columns the merged timeline can be sorted by (sorting happens in memory). */
export const VEHICLE_DOC_SORTS: SortMap = {
  date: "desc",
  kind: "asc",
  ref: "asc",
  party: "asc",
  amount: "desc",
  status: "asc",
};

export interface VehicleHistory {
  /** The current page of documents. */
  documents: VehicleDocument[];
  /** Paging envelope for `documents`; totals below cover the whole filter. */
  page: Omit<Paged<VehicleDocument>, "rows">;
  sort: ResolvedSort;
  counts: Record<VehicleDocKind, number>;
  totals: {
    quoted: number;
    invoiced: number;
    /** What Bade spent on parts for this vehicle (purchase orders). */
    parts: number;
    /** invoiced − parts. Only meaningful once both exist. */
    margin: number;
    jobs: number;
  };
  /** Invoiced revenue for the six months up to the most recent activity. */
  monthly: { label: string; value: number }[];
  firstSeen: string | null;
  lastActivity: string | null;
}

export interface VehicleHistoryFilter extends Pick<ListOptions, "sort" | "dir" | "page" | "perPage"> {
  /** Inclusive ISO date bounds. */
  from?: string;
  to?: string;
  kind?: VehicleDocKind;
}

/** Order two timeline entries by one column, ignoring direction. */
function compareBy(a: VehicleDocument, b: VehicleDocument, key: string): number {
  switch (key) {
    case "amount":
      // Job deliveries carry no money — keep them together at one end.
      return (a.amount ?? -1) - (b.amount ?? -1);
    case "kind":
      return a.kind.localeCompare(b.kind);
    case "ref":
      return a.ref.localeCompare(b.ref, undefined, { numeric: true });
    case "party":
      return (a.party ?? "").localeCompare(b.party ?? "");
    case "status":
      return a.status.localeCompare(b.status);
    default:
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
  }
}

interface Row {
  id: string;
  total?: number | null;
  status: string;
}

function isValidKind(value: string | undefined): value is VehicleDocKind {
  return VEHICLE_DOC_KINDS.some((k) => k.value === value);
}

/** Normalise a `yyyy-MM-dd` search param, ignoring anything malformed. */
export function parseDateParam(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}

export function parseKindParam(value: string | undefined): VehicleDocKind | undefined {
  return isValidKind(value) ? value : undefined;
}

/** Six month buckets ending on `end`, e.g. ["Apr", … , "Sep"]. */
function monthBuckets(end: Date): { key: string; label: string; value: number }[] {
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    buckets.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en", { month: "short", timeZone: "UTC" }),
      value: 0,
    });
  }
  return buckets;
}

export async function getVehicleHistory(
  vehicleId: string,
  filter: VehicleHistoryFilter = {},
): Promise<VehicleHistory> {
  const supabase = await createClient();
  const { from, to, kind } = filter;

  /** Apply the shared vehicle + date-range predicate to one table. */
  const scoped = (table: string, columns: string, dateColumn: string) => {
    let query = supabase.from(table).select(columns).eq("vehicle_id", vehicleId);
    if (from) query = query.gte(dateColumn, from);
    if (to) query = query.lte(dateColumn, to);
    return query.order(dateColumn, { ascending: false });
  };

  const want = (k: VehicleDocKind) => !kind || kind === k;

  const [quotations, invoices, purchaseOrders, jobDeliveries] = await Promise.all([
    want("quotation")
      ? scoped("quotations", "id, ref_no, quote_date, customer_name, job_title, total, status", "quote_date")
      : Promise.resolve({ data: [] }),
    want("invoice")
      ? scoped("invoices", "id, invoice_no, invoice_date, customer_name, po_no, total, status", "invoice_date")
      : Promise.resolve({ data: [] }),
    want("purchase_order")
      ? scoped("purchase_orders", "id, po_no, po_date, supplier_name, vehicle_ref, total, status", "po_date")
      : Promise.resolve({ data: [] }),
    want("job_delivery")
      ? scoped("job_deliveries", "id, jd_no, delivery_date, customer_name, work_done, status", "delivery_date")
      : Promise.resolve({ data: [] }),
  ]);

  const documents: VehicleDocument[] = [];

  for (const q of (quotations.data ?? []) as unknown as (Row & {
    ref_no: string; quote_date: string; customer_name: string; job_title: string | null;
  })[]) {
    documents.push({
      kind: "quotation",
      id: q.id,
      ref: q.ref_no,
      date: q.quote_date,
      party: q.customer_name,
      summary: q.job_title,
      amount: Number(q.total ?? 0),
      status: q.status,
      href: `/quotations/${q.id}`,
    });
  }

  for (const inv of (invoices.data ?? []) as unknown as (Row & {
    invoice_no: string; invoice_date: string; customer_name: string; po_no: string | null;
  })[]) {
    documents.push({
      kind: "invoice",
      id: inv.id,
      ref: inv.invoice_no,
      date: inv.invoice_date,
      party: inv.customer_name,
      summary: inv.po_no ? `Customer PO ${inv.po_no}` : null,
      amount: Number(inv.total ?? 0),
      status: inv.status,
      href: `/invoices/${inv.id}`,
    });
  }

  for (const po of (purchaseOrders.data ?? []) as unknown as (Row & {
    po_no: string; po_date: string; supplier_name: string; vehicle_ref: string | null;
  })[]) {
    documents.push({
      kind: "purchase_order",
      id: po.id,
      ref: po.po_no,
      date: po.po_date,
      party: po.supplier_name,
      summary: po.vehicle_ref,
      amount: Number(po.total ?? 0),
      status: po.status,
      href: `/purchase-orders/${po.id}`,
    });
  }

  for (const jd of (jobDeliveries.data ?? []) as unknown as (Row & {
    jd_no: string; delivery_date: string; customer_name: string; work_done: string | null;
  })[]) {
    documents.push({
      kind: "job_delivery",
      id: jd.id,
      ref: jd.jd_no,
      date: jd.delivery_date,
      party: jd.customer_name,
      summary: jd.work_done,
      amount: null,
      status: jd.status,
      href: `/job-deliveries/${jd.id}`,
    });
  }

  const sort = resolveSort(VEHICLE_DOC_SORTS, "date", filter.sort, filter.dir);
  const factor = sort.ascending ? 1 : -1;
  documents.sort((a, b) => {
    const primary = compareBy(a, b, sort.column) * factor;
    if (primary !== 0) return primary;
    // Stable tiebreak so paging never reshuffles equal rows.
    return `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`);
  });

  const counts: Record<VehicleDocKind, number> = {
    quotation: 0,
    invoice: 0,
    purchase_order: 0,
    job_delivery: 0,
  };
  let quoted = 0;
  let invoiced = 0;
  let parts = 0;

  for (const doc of documents) {
    counts[doc.kind] += 1;
    if (doc.kind === "quotation") quoted += doc.amount ?? 0;
    // Cancelled invoices are not revenue.
    if (doc.kind === "invoice" && doc.status !== "cancelled") invoiced += doc.amount ?? 0;
    if (doc.kind === "purchase_order" && doc.status !== "cancelled") parts += doc.amount ?? 0;
  }

  // First/last activity are date facts, independent of the chosen sort.
  const dates = documents.map((d) => d.date).sort();
  const firstSeen = dates[0] ?? null;
  const lastActivity = dates[dates.length - 1] ?? null;

  const buckets = monthBuckets(lastActivity ? new Date(`${lastActivity}T00:00:00Z`) : new Date());
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const doc of documents) {
    if (doc.kind !== "invoice" || doc.status === "cancelled") continue;
    const bucket = byKey.get(doc.date.slice(0, 7));
    if (bucket) bucket.value = round2(bucket.value + (doc.amount ?? 0));
  }

  // Totals above cover every matching document; only the list itself is paged.
  const requested = resolvePaging(filter);
  const pageCount = Math.max(1, Math.ceil(documents.length / requested.perPage));
  // Clamp before slicing so an out-of-range `?page=` still shows real rows.
  const paging = resolvePaging({ ...filter, page: Math.min(requested.page, pageCount) });
  const { rows, ...page } = toPaged(
    documents.slice(paging.offset, paging.offset + paging.perPage),
    documents.length,
    paging,
  );

  return {
    documents: rows,
    page,
    sort,
    counts,
    totals: {
      quoted: round2(quoted),
      invoiced: round2(invoiced),
      parts: round2(parts),
      margin: round2(invoiced - parts),
      jobs: counts.job_delivery,
    },
    monthly: buckets.map(({ label, value }) => ({ label, value })),
    firstSeen,
    lastActivity,
  };
}
