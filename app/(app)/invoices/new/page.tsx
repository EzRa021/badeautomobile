import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { InvoiceForm } from "@/components/app/invoice-form";
import { listCustomers, getQuotation, getCompanySettings } from "@/lib/db/queries";
import { peekDocumentNumber } from "@/lib/db/numbering";
import { toDateInputValue } from "@/lib/utils/dates";
import { toNumber } from "@/lib/utils/money";
import type { Row } from "@/components/app/line-items-editor";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ from_quotation?: string }>;
}) {
  const { from_quotation } = await searchParams;

  const [customers, defaultNo, settings] = await Promise.all([
    listCustomers(),
    peekDocumentNumber("invoice"),
    getCompanySettings(),
  ]);

  let seed:
    | { customer_id?: string | null; customer_name?: string; customer_address?: string | null; rows?: Row[] }
    | undefined;

  if (from_quotation) {
    const q = await getQuotation(from_quotation);
    if (q) {
      seed = {
        customer_id: q.customer_id,
        customer_name: q.customer_name,
        customer_address: q.customer_address,
        rows: q.items.map((it) => {
          const unit = it.rate != null ? it.rate : it.qty ? toNumber(it.amount) / toNumber(it.qty) : 0;
          return {
            item_code: "",
            description: it.description,
            qty: String(it.qty ?? 1),
            unit_price: String(Math.round(unit * 100) / 100),
            amount: String(it.amount ?? ""),
          };
        }),
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New invoice"
        breadcrumbs={[{ label: "Invoices", href: "/invoices" }, { label: "New" }]}
      />
      <InvoiceForm
        customers={customers}
        defaultNo={defaultNo}
        defaultDate={toDateInputValue(new Date())}
        defaultVatRate={settings?.vat_rate ?? 7.5}
        fromQuotationId={from_quotation}
        seed={seed}
      />
    </div>
  );
}
