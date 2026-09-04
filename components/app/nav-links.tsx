"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils/cn";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-5 px-3 py-4">
      {NAV.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {section.heading && (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/45">
              {section.heading}
            </p>
          )}
          {section.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-foreground/12 text-primary-foreground"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/8 hover:text-primary-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    active ? "text-amber" : "text-primary-foreground/60 group-hover:text-primary-foreground/90",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
