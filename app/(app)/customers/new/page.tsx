import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ContactForm } from "@/components/app/contact-form";
import { saveCustomer } from "@/lib/actions/customers";

export const metadata: Metadata = { title: "New customer" };

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New customer"
        breadcrumbs={[{ label: "Customers", href: "/customers" }, { label: "New" }]}
      />
      <ContactForm action={saveCustomer} entityLabel="Customer" cancelHref="/customers" />
    </div>
  );
}
