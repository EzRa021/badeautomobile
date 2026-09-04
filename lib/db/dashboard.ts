import { createClient } from "@/lib/supabase/server";
import { round2 } from "@/lib/utils/money";

export interface RecentDoc {
  id: string;
  kind: "quotation" | "invoice" | "purchase_order" | "job_delivery";
  number: string;
  party: string;
  amount: number | null;
  date: string;
  status: string;
  href: string;
}

export interface DashboardData {
  counts: { quotations: number; invoices: number; purchaseOrders: number; jobDeliveries: number };
  quotedTotal: number;
  invoicedTotal: number;
  outstandingTotal: number;
  poTotal: number;
  recent: RecentDoc[];
  monthlyRevenue: { label: string; value: number }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const [quotations, invoices, purchaseOrders, jobDeliveries] = await Promise.all([
    supabase.from("quotations").select("id, ref_no, customer_name, total, status, quote_date").order("quote_date", { ascending: false }),
    supabase.from("invoices").select("id, invoice_no, customer_name, total, status, invoice_date").order("invoice_date", { ascending: false }),
    supabase.from("purchase_orders").select("id, po_no, supplier_name, total, status, po_date").order("po_date", { ascending: false }),
    supabase.from("job_deliveries").select("id, jd_no, customer_name, status, delivery_date").order("delivery_date", { ascending: false }),
  ]);

  const q = quotations.data ?? [];
  const inv = invoices.data ?? [];
  const po = purchaseOrders.data ?? [];
  const jd = jobDeliveries.data ?? [];

  const quotedTotal = round2(q.reduce((s, r) => s + Number(r.total ?? 0), 0));
  const invoicedTotal = round2(inv.reduce((s, r) => s + Number(r.total ?? 0), 0));
  const outstandingTotal = round2(
    inv.filter((r) => r.status === "unpaid" || r.status === "partial").reduce((s, r) => s + Number(r.total ?? 0), 0),
  );
  const poTotal = round2(po.reduce((s, r) => s + Number(r.total ?? 0), 0));

  // Recent activity across types (top 8 by date)
  const recent: RecentDoc[] = [
    ...q.map((r) => ({ id: r.id, kind: "quotation" as const, number: r.ref_no, party: r.customer_name, amount: Number(r.total ?? 0), date: r.quote_date, status: r.status, href: `/quotations/${r.id}` })),
    ...inv.map((r) => ({ id: r.id, kind: "invoice" as const, number: r.invoice_no, party: r.customer_name, amount: Number(r.total ?? 0), date: r.invoice_date, status: r.status, href: `/invoices/${r.id}` })),
    ...po.map((r) => ({ id: r.id, kind: "purchase_order" as const, number: r.po_no, party: r.supplier_name, amount: Number(r.total ?? 0), date: r.po_date, status: r.status, href: `/purchase-orders/${r.id}` })),
    ...jd.map((r) => ({ id: r.id, kind: "job_delivery" as const, number: r.jd_no, party: r.customer_name, amount: null, date: r.delivery_date, status: r.status, href: `/job-deliveries/${r.id}` })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8);

  // Invoiced revenue for the last 6 calendar months
  const now = new Date();
  const buckets: { label: string; key: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      label: d.toLocaleDateString("en-NG", { month: "short" }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      value: 0,
    });
  }
  for (const r of inv) {
    if (r.status === "cancelled") continue;
    const key = String(r.invoice_date ?? "").slice(0, 7);
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.value += Number(r.total ?? 0);
  }

  return {
    counts: { quotations: q.length, invoices: inv.length, purchaseOrders: po.length, jobDeliveries: jd.length },
    quotedTotal,
    invoicedTotal,
    outstandingTotal,
    poTotal,
    recent,
    monthlyRevenue: buckets.map((b) => ({ label: b.label, value: round2(b.value) })),
  };
}
