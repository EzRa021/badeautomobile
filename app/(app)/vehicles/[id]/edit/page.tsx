import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { VehicleForm } from "@/components/app/vehicle-form";
import { getVehicle, listCustomers } from "@/lib/db/queries";

export const metadata: Metadata = { title: "Edit vehicle" };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicle, customers] = await Promise.all([getVehicle(id), listCustomers()]);
  if (!vehicle) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={vehicle.description}
        breadcrumbs={[{ label: "Vehicles", href: "/vehicles" }, { label: "Edit" }]}
      />
      <VehicleForm record={vehicle} customers={customers} />
    </div>
  );
}
