import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { JobDeliveryForm } from "@/components/app/job-delivery-form";
import { listCustomers, listVehicles, getQuotation, getVehicle } from "@/lib/db/queries";
import { peekDocumentNumber } from "@/lib/db/numbering";
import { toDateInputValue } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "New job delivery" };

export default async function NewJobDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ from_quotation?: string }>;
}) {
  const { from_quotation } = await searchParams;

  const [customers, vehicles, defaultNo] = await Promise.all([
    listCustomers(),
    listVehicles(),
    peekDocumentNumber("job_delivery"),
  ]);

  let seed:
    | {
        customer_id?: string | null;
        customer_name?: string;
        customer_address?: string | null;
        vehicle_id?: string | null;
        vehicle?: string | null;
        work_done?: string | null;
      }
    | undefined;

  if (from_quotation) {
    const q = await getQuotation(from_quotation);
    if (q) {
      const vehicle = q.vehicle_id ? await getVehicle(q.vehicle_id) : null;
      seed = {
        customer_id: q.customer_id,
        customer_name: q.customer_name,
        customer_address: q.customer_address,
        vehicle_id: q.vehicle_id,
        vehicle: vehicle?.description ?? null,
        work_done: q.job_title,
      };
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New job delivery"
        breadcrumbs={[{ label: "Job Delivery", href: "/job-deliveries" }, { label: "New" }]}
      />
      <JobDeliveryForm
        customers={customers}
        vehicles={vehicles}
        defaultNo={defaultNo}
        defaultDate={toDateInputValue(new Date())}
        seed={seed}
      />
    </div>
  );
}
