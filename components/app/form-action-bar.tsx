import { cn } from "@/lib/utils/cn";

/**
 * Form action row. On phones it becomes a sticky bar pinned above the bottom tab
 * bar so Save/Create is always reachable; on desktop it's a normal right-aligned row.
 */
export function FormActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-6 flex items-center gap-2 sm:justify-end",
        // sticky bar on small screens
        "max-lg:sticky max-lg:bottom-[calc(4rem+env(safe-area-inset-bottom))] max-lg:z-30 max-lg:-mx-4 max-lg:border-t max-lg:border-border max-lg:bg-background/95 max-lg:px-4 max-lg:py-3 max-lg:backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
