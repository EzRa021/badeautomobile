import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/** A page-width list of records (replaces horizontally-scrolling tables on mobile). */
export function RecordList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <ul className="divide-y divide-border">{children}</ul>
    </Card>
  );
}

export function RecordRow({
  href,
  chip,
  title,
  subtitle,
  right,
  actions,
}: {
  href?: string;
  chip?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned block, e.g. amount over a status badge. */
  right?: React.ReactNode;
  /** Trailing controls (edit/delete) rendered outside the link. */
  actions?: React.ReactNode;
}) {
  const main = (
    <>
      {chip && <div className="shrink-0">{chip}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{title}</div>
        {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {right && <div className="flex shrink-0 flex-col items-end gap-1 text-right">{right}</div>}
    </>
  );

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-2">
          {main}
          {!actions && !right && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{main}</div>
      )}
      {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
    </li>
  );
}
