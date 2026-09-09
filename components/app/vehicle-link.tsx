import Link from "next/link";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The vehicle a document was raised against, linked to its service history.
 * Falls back to plain text when the vehicle is only a snapshot (the registry
 * row was deleted, or the document predates vehicle linking).
 *
 * In a table pass `showIcon={false}` with a clamp/width class — the icon's
 * flex box would fight `line-clamp`, and vehicle names run long
 * ("Toyota Cruiser Prado AGL 589 EW").
 */
export function VehicleLink({
  id,
  label,
  className,
  showIcon = true,
}: {
  id: string | null | undefined;
  label: string | null | undefined;
  className?: string;
  showIcon?: boolean;
}) {
  const text = label?.trim();
  if (!text && !id) return null;

  const display = text || "View history";
  const body = showIcon ? (
    <>
      <Car className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{display}</span>
    </>
  ) : (
    display
  );
  const layout = showIcon ? "inline-flex max-w-full items-center gap-1.5" : "";

  if (!id) {
    return (
      <span className={cn(layout, className)} title={text ?? undefined}>
        {body}
      </span>
    );
  }

  return (
    <Link
      href={`/vehicles/${id}`}
      title={text ?? undefined}
      className={cn(
        layout,
        "font-medium text-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      {body}
    </Link>
  );
}
