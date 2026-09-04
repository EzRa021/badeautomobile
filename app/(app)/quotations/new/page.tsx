import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { QuotationForm } from "@/components/app/quotation-form";
import { listCustomers, listVehicles } from "@/lib/db/queries";
import { peekDocumentNumber } from "@/lib/db/numbering";
import { toDateInputValue } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "New quotation" };

export default async function NewQuotationPage() {
  const [customers, vehicles, defaultRef] = await Promise.all([
    listCustomers(),
    listVehicles(),
    peekDocumentNumber("quotation"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New quotation"
        breadcrumbs={[{ label: "Quotations", href: "/quotations" }, { label: "New" }]}
      />
      <QuotationForm
        customers={customers}
        vehicles={vehicles}
        defaultRef={defaultRef}
        defaultDate={toDateInputValue(new Date())}
      />
    </div>
  );
}
