import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { listPurchaseOrders } from "@/lib/db/queries";
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

export const metadata: Metadata = { title: "Purchase Orders" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const orders = await listPurchaseOrders({ q, status });

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        description="Orders you raise to suppliers for parts and services."
        actions={
          <Button asChild className="max-sm:hidden">
            <Link href="/purchase-orders/new">
              <Plus /> New purchase order
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search by PO no, supplier or ref…" />
        <StatusFilter options={STATUS_OPTIONS} />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={q || status ? "No purchase orders match" : "No purchase orders yet"}
          description={q || status ? "Adjust your search or filter." : "Raise a purchase order to a supplier."}
          actionLabel={q || status ? undefined : "New purchase order"}
          actionHref={q || status ? undefined : "/purchase-orders/new"}
        />
      ) : (
        <RecordList>
          {orders.map((po) => (
            <RecordRow
              key={po.id}
              href={`/purchase-orders/${po.id}`}
              chip={<ReferenceChip>{po.po_no}</ReferenceChip>}
              title={po.supplier_name}
              subtitle={`${formatDisplayDate(po.po_date)}${po.vehicle_ref ? " · " + po.vehicle_ref : ""}`}
              right={
                <>
                  <span className="font-mono text-sm tabular-nums">{formatNaira(po.total)}</span>
                  <StatusBadge status={po.status} />
                </>
              }
            />
          ))}
        </RecordList>
      )}
    </>
  );
}
