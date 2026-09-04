import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { JobDeliveryForm } from "@/components/app/job-delivery-form";
import { getJobDelivery, listCustomers, listVehicles } from "@/lib/db/queries";
import { toDateInputValue } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Edit job delivery" };

export default async function EditJobDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [jd, customers, vehicles] = await Promise.all([
    getJobDelivery(id),
    listCustomers(),
    listVehicles(),
  ]);
  if (!jd) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={`Edit ${jd.jd_no}`}
        breadcrumbs={[
          { label: "Job Delivery", href: "/job-deliveries" },
          { label: jd.jd_no, href: `/job-deliveries/${jd.id}` },
          { label: "Edit" },
        ]}
      />
      <JobDeliveryForm
        record={jd}
        customers={customers}
        vehicles={vehicles}
        defaultNo={jd.jd_no}
        defaultDate={toDateInputValue(jd.delivery_date)}
      />
    </div>
  );
}
