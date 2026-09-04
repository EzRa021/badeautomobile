import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  accent = "brand",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  href?: string;
  accent?: "brand" | "amber" | "slate";
}) {
  const accentCls =
    accent === "amber"
      ? "bg-amber-050 text-amber"
      : accent === "slate"
        ? "bg-muted text-muted-foreground"
        : "bg-brand-050 text-primary";

  const body = (
    <Card className="group h-full p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className={cn("grid size-9 place-items-center rounded-lg", accentCls)}>
          <Icon className="size-5" />
        </span>
        {href && (
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground/80">{sub}</p>}
    </Card>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
