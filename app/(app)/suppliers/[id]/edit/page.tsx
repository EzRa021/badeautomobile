import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ContactForm } from "@/components/app/contact-form";
import { saveSupplier } from "@/lib/actions/suppliers";
import { getSupplier } from "@/lib/db/queries";

export const metadata: Metadata = { title: "Edit supplier" };

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={supplier.name}
        breadcrumbs={[{ label: "Suppliers", href: "/suppliers" }, { label: "Edit" }]}
      />
      <ContactForm action={saveSupplier} record={supplier} entityLabel="Supplier" cancelHref="/suppliers" />
    </div>
  );
}
