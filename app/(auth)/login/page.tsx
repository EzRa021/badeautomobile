import type { Metadata } from "next";
import Image from "next/image";
import { FileText, Truck, Receipt, ShoppingCart } from "lucide-react";
import { LoginForm } from "@/components/app/login-form";

export const metadata: Metadata = { title: "Sign in" };

const DOC_TYPES = [
  { icon: FileText, label: "Quotations" },
  { icon: Truck, label: "Job Delivery" },
  { icon: Receipt, label: "Invoices" },
  { icon: ShoppingCart, label: "Purchase Orders" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const dest = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-brand-600/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-[26rem] rounded-full bg-amber/10 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-primary-foreground/95 p-1.5 shadow-sm">
            <Image src="/brand/logo-mark.jpg" alt="" width={44} height={36} className="h-9 w-auto" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold tracking-tight">BADE AUTOMOBILE</p>
            <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/70">Ltd</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight">
            Every document, on the company letterhead.
          </h1>
          <p className="mt-4 text-primary-foreground/75">
            Draft, number, and print quotations, job delivery reports, invoices and
            purchase orders — accurate totals and PDFs in a few clicks.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {DOC_TYPES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-3 py-1 text-sm text-primary-foreground/85"
              >
                <Icon className="size-3.5" /> {label}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/55">
          17, Akindeko Akinbamidele Street, Ogun State · TIN 20724729-001
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Image src="/brand/logo-mark.jpg" alt="" width={40} height={32} className="h-8 w-auto rounded-md" />
            <span className="font-display text-lg font-semibold tracking-tight">Bade Automobile</span>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <LoginForm next={dest} />

          <p className="mt-6 text-xs text-muted-foreground">
            Access is limited to Bade Automobile staff. Contact your administrator if you
            need an account.
          </p>
        </div>
      </div>
    </div>
  );
}
