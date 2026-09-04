import Link from "next/link";
import { Plus, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-brand-050 text-primary">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Button asChild className="mt-5">
          <Link href={actionHref}>
            <Plus /> {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}
