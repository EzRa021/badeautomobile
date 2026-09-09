import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { QuotationForm } from "@/components/app/quotation-form";
import { getVehicle, listCustomers, listVehicles } from "@/lib/db/queries";
import { peekDocumentNumber } from "@/lib/db/numbering";
import { toDateInputValue } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "New quotation" };

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const { vehicle: vehicleId } = await searchParams;

  const [customers, vehicles, defaultRef] = await Promise.all([
    listCustomers(),
    listVehicles(),
    peekDocumentNumber("quotation"),
  ]);

  // Started from a vehicle's history page — pre-select it.
  const seeded = vehicleId ? await getVehicle(vehicleId) : null;

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
        defaultVehicle={
          seeded
            ? { id: seeded.id, label: seeded.description, reg_no: seeded.reg_no ?? "" }
            : undefined
        }
      />
    </div>
  );
}
