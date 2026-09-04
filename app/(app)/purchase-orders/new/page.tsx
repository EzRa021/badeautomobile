import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PurchaseOrderForm } from "@/components/app/purchase-order-form";
import { listSuppliers } from "@/lib/db/queries";
import { peekDocumentNumber } from "@/lib/db/numbering";
import { toDateInputValue } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "New purchase order" };

export default async function NewPurchaseOrderPage() {
  const [suppliers, defaultNo] = await Promise.all([
    listSuppliers(),
    peekDocumentNumber("purchase_order"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New purchase order"
        breadcrumbs={[{ label: "Purchase Orders", href: "/purchase-orders" }, { label: "New" }]}
      />
      <PurchaseOrderForm suppliers={suppliers} defaultNo={defaultNo} defaultDate={toDateInputValue(new Date())} />
    </div>
  );
}
