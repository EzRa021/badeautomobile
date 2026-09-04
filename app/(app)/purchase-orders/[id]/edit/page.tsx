import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { PurchaseOrderForm } from "@/components/app/purchase-order-form";
import { getPurchaseOrder, listSuppliers } from "@/lib/db/queries";
import { toDateInputValue } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Edit purchase order" };

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [po, suppliers] = await Promise.all([getPurchaseOrder(id), listSuppliers()]);
  if (!po) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Edit ${po.po_no}`}
        breadcrumbs={[
          { label: "Purchase Orders", href: "/purchase-orders" },
          { label: po.po_no, href: `/purchase-orders/${po.id}` },
          { label: "Edit" },
        ]}
      />
      <PurchaseOrderForm record={po} suppliers={suppliers} defaultNo={po.po_no} defaultDate={toDateInputValue(po.po_date)} />
    </div>
  );
}
