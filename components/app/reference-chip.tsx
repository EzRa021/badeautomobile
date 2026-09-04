import { cn } from "@/lib/utils/cn";

/** The signature "work-order tag": a document's number in mono on a bordered chip. */
export function ReferenceChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-[13px] font-medium tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
