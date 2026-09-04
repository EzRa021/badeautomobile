import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "@/components/app/nav-links";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-primary text-primary-foreground">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 border-b border-primary-foreground/10 px-5 py-4"
      >
        <span className="grid size-10 place-items-center rounded-lg bg-primary-foreground/95 p-1 shadow-sm">
          <Image src="/brand/logo-mark.jpg" alt="" width={36} height={30} className="h-7 w-auto" />
        </span>
        <span className="leading-tight">
          <span className="block font-display text-[15px] font-semibold tracking-tight">
            Bade Automobile
          </span>
          <span className="block text-[11px] uppercase tracking-[0.2em] text-primary-foreground/55">
            Documents
          </span>
        </span>
      </Link>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="border-t border-primary-foreground/10 px-5 py-3">
        <p className="text-[11px] leading-relaxed text-primary-foreground/45">
          Bade Automobile Ltd · Ogun State
          <br />
          TIN 20724729-001
        </p>
      </div>
    </div>
  );
}
