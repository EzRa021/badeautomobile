import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { VehicleForm } from "@/components/app/vehicle-form";
import { listCustomers } from "@/lib/db/queries";

export const metadata: Metadata = { title: "New vehicle" };

export default async function NewVehiclePage() {
  const customers = await listCustomers();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New vehicle"
        breadcrumbs={[{ label: "Vehicles", href: "/vehicles" }, { label: "New" }]}
      />
      <VehicleForm customers={customers} />
    </div>
  );
}
