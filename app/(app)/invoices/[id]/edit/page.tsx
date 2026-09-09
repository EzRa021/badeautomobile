import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { InvoiceForm } from "@/components/app/invoice-form";
import { getInvoice, listCustomers, listVehicles, getCompanySettings } from "@/lib/db/queries";
import { toDateInputValue } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, customers, vehicles, settings] = await Promise.all([
    getInvoice(id),
    listCustomers(),
    listVehicles(),
    getCompanySettings(),
  ]);
  if (!invoice) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Edit ${invoice.invoice_no}`}
        breadcrumbs={[
          { label: "Invoices", href: "/invoices" },
          { label: invoice.invoice_no, href: `/invoices/${invoice.id}` },
          { label: "Edit" },
        ]}
      />
      <InvoiceForm
        record={invoice}
        customers={customers}
        vehicles={vehicles}
        defaultNo={invoice.invoice_no}
        defaultDate={toDateInputValue(invoice.invoice_date)}
        defaultVatRate={settings?.vat_rate ?? 7.5}
      />
    </div>
  );
}
