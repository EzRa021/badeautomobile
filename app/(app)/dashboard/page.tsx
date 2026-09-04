import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Receipt, FileText, ShoppingCart, Truck, Users } from "lucide-react";
import { getDashboardData } from "@/lib/db/dashboard";
import { formatNaira } from "@/lib/utils/money";
import { formatDisplayDate } from "@/lib/utils/dates";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { MiniBarChart } from "@/components/app/mini-bar-chart";
import { StatusBadge } from "@/components/app/status-badge";
import { ReferenceChip } from "@/components/app/reference-chip";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

const KIND_LABEL: Record<string, string> = {
  quotation: "Quotation",
  invoice: "Invoice",
  purchase_order: "Purchase Order",
  job_delivery: "Job Delivery",
};

const QUICK_ACTIONS = [
  { href: "/quotations/new", label: "New quotation", icon: FileText },
  { href: "/invoices/new", label: "New invoice", icon: Receipt },
  { href: "/purchase-orders/new", label: "New purchase order", icon: ShoppingCart },
  { href: "/job-deliveries/new", label: "New job delivery", icon: Truck },
];

export default async function DashboardPage() {
  const data = await getDashboardData();
  const totalDocs =
    data.counts.quotations + data.counts.invoices + data.counts.purchaseOrders + data.counts.jobDeliveries;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your workshop's documents at a glance."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/customers/new">
                <Users /> New customer
              </Link>
            </Button>
            <Button asChild>
              <Link href="/quotations/new">
                <Plus /> New quotation
              </Link>
            </Button>
          </>
        }
      />

      {totalDocs === 0 ? (
        <EmptyState
          icon={FileText}
          title="Welcome to Bade Automobile Documents"
          description="Create your first quotation, invoice, purchase order or job delivery report. Everything prints on the company letterhead."
          actionLabel="Create a quotation"
          actionHref="/quotations/new"
        />
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total invoiced"
              value={formatNaira(data.invoicedTotal)}
              sub={`${formatNaira(data.outstandingTotal)} outstanding`}
              icon={Receipt}
              href="/invoices"
              accent="brand"
            />
            <StatCard
              label="Total quoted"
              value={formatNaira(data.quotedTotal)}
              sub={`${data.counts.quotations} quotation${data.counts.quotations === 1 ? "" : "s"}`}
              icon={FileText}
              href="/quotations"
              accent="amber"
            />
            <StatCard
              label="Purchase orders"
              value={formatNaira(data.poTotal)}
              sub={`${data.counts.purchaseOrders} order${data.counts.purchaseOrders === 1 ? "" : "s"}`}
              icon={ShoppingCart}
              href="/purchase-orders"
              accent="slate"
            />
            <StatCard
              label="Job deliveries"
              value={String(data.counts.jobDeliveries)}
              sub="Reports handed over"
              icon={Truck}
              href="/job-deliveries"
              accent="slate"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Recent activity */}
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent activity</CardTitle>
                <Link href="/invoices" className="text-sm text-primary hover:underline">
                  View invoices
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {data.recent.map((r) => (
                    <li key={`${r.kind}-${r.id}`}>
                      <Link href={r.href} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <ReferenceChip>{r.number}</ReferenceChip>
                            <span className="text-xs text-muted-foreground">{KIND_LABEL[r.kind]}</span>
                          </div>
                          <p className="mt-1 truncate text-sm">{r.party}</p>
                        </div>
                        <div className="hidden text-right sm:block">
                          {r.amount != null && (
                            <p className="font-mono text-sm tabular-nums">{formatNaira(r.amount)}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{formatDisplayDate(r.date)}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Chart + quick actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoiced — last 6 months</CardTitle>
                </CardHeader>
                <CardContent>
                  <MiniBarChart data={data.monthlyRevenue} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick create</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((a) => (
                    <Button key={a.href} asChild variant="outline" size="sm" className="justify-start">
                      <Link href={a.href}>
                        <a.icon /> {a.label.replace("New ", "")}
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
