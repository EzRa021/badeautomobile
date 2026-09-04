"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Receipt, Menu, LogOut } from "lucide-react";
import { NAV } from "@/lib/nav";
import { signOut } from "@/lib/actions/auth";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Quotes", href: "/quotations", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreActive = !TABS.some((t) => isActive(t.href));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Primary"
      >
        {TABS.map((t) => {
          const active = isActive(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("size-5", active && "text-primary")} />
              {t.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
            moreActive && moreOpen ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Menu className="size-5" />
          More
        </button>
      </nav>

      <BottomSheet open={moreOpen} onOpenChange={setMoreOpen} title="Menu">
        <div className="space-y-4">
          {NAV.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {section.heading}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "border-primary/30 bg-brand-050 text-primary"
                          : "border-border bg-card text-foreground hover:bg-accent",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <form action={signOut} className="pt-1">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </BottomSheet>
    </>
  );
}
