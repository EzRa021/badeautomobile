import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ContactForm } from "@/components/app/contact-form";
import { saveCustomer } from "@/lib/actions/customers";
import { getCustomer } from "@/lib/db/queries";

export const metadata: Metadata = { title: "Edit customer" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={customer.name}
        breadcrumbs={[{ label: "Customers", href: "/customers" }, { label: "Edit" }]}
      />
      <ContactForm action={saveCustomer} record={customer} entityLabel="Customer" cancelHref="/customers" />
    </div>
  );
}
