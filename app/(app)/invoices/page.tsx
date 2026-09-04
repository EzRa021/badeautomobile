import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { listInvoices } from "@/lib/db/queries";
import { formatDisplayDate } from "@/lib/utils/dates";
import { formatNaira } from "@/lib/utils/money";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { StatusFilter } from "@/components/app/status-filter";
import { EmptyState } from "@/components/app/empty-state";
import { StatusBadge } from "@/components/app/status-badge";
import { ReferenceChip } from "@/components/app/reference-chip";
import { RecordList, RecordRow } from "@/components/app/record-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Part-paid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const invoices = await listInvoices({ q, status });

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Bills issued to customers after work is completed. VAT applied at 7.5%."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/invoices/new">
              <Plus /> New invoice
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search by number, customer or PO…" />
        <StatusFilter options={STATUS_OPTIONS} />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={q || status ? "No invoices match" : "No invoices yet"}
          description={q || status ? "Adjust your search or filter." : "Create your first invoice to bill a customer."}
          actionLabel={q || status ? undefined : "New invoice"}
          actionHref={q || status ? undefined : "/invoices/new"}
        />
      ) : (
        <RecordList>
          {invoices.map((inv) => (
            <RecordRow
              key={inv.id}
              href={`/invoices/${inv.id}`}
              chip={<ReferenceChip>{inv.invoice_no}</ReferenceChip>}
              title={inv.customer_name}
              subtitle={`${formatDisplayDate(inv.invoice_date)}${inv.po_no ? " · PO " + inv.po_no : ""}`}
              right={
                <>
                  <span className="font-mono text-sm tabular-nums">{formatNaira(inv.total)}</span>
                  <StatusBadge status={inv.status} />
                </>
              }
            />
          ))}
        </RecordList>
      )}
    </>
  );
}
