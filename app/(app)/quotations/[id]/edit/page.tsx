import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { QuotationForm } from "@/components/app/quotation-form";
import { getQuotation, listCustomers, listVehicles } from "@/lib/db/queries";
import { toDateInputValue } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Edit quotation" };

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quotation, customers, vehicles] = await Promise.all([
    getQuotation(id),
    listCustomers(),
    listVehicles(),
  ]);
  if (!quotation) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Edit ${quotation.ref_no}`}
        breadcrumbs={[
          { label: "Quotations", href: "/quotations" },
          { label: quotation.ref_no, href: `/quotations/${quotation.id}` },
          { label: "Edit" },
        ]}
      />
      <QuotationForm
        record={quotation}
        customers={customers}
        vehicles={vehicles}
        defaultRef={quotation.ref_no}
        defaultDate={toDateInputValue(quotation.quote_date)}
      />
    </div>
  );
}
