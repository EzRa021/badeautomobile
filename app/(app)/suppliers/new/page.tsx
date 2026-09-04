import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ContactForm } from "@/components/app/contact-form";
import { saveSupplier } from "@/lib/actions/suppliers";

export const metadata: Metadata = { title: "New supplier" };

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New supplier"
        breadcrumbs={[{ label: "Suppliers", href: "/suppliers" }, { label: "New" }]}
      />
      <ContactForm action={saveSupplier} entityLabel="Supplier" cancelHref="/suppliers" />
    </div>
  );
}
