"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FileText, Receipt, ShoppingCart, Truck, Users } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils/cn";

const ACTIONS = [
  { href: "/quotations/new", label: "Quotation", desc: "Price estimate", icon: FileText },
  { href: "/invoices/new", label: "Invoice", desc: "Bill a customer", icon: Receipt },
  { href: "/purchase-orders/new", label: "Purchase Order", desc: "Order from a supplier", icon: ShoppingCart },
  { href: "/job-deliveries/new", label: "Job Delivery", desc: "Handover report", icon: Truck },
  { href: "/customers/new", label: "Customer", desc: "Add to registry", icon: Users },
];

export function QuickCreateFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick create"
        className={cn(
          "fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 lg:hidden",
        )}
      >
        <Plus className="size-6" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen} title="Create new">
        <div className="space-y-2">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:bg-accent"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-brand-050 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium">{a.label}</span>
                  <span className="block text-xs text-muted-foreground">{a.desc}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
