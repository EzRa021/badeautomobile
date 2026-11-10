import { formatNaira } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

export interface TotalRow {
  label: string;
  value: number;
  bold?: boolean;
  /** A deduction: shown as −₦x so it reads as money coming off. */
  negative?: boolean;
}

export function DocumentTotals({
  rows,
  words,
  note,
  className,
}: {
  rows: TotalRow[];
  words?: string;
  /** Small print under the totals, e.g. what is already included. */
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-end gap-3", className)}>
      <dl className="w-full max-w-xs space-y-1.5">
        {rows.map((r, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between gap-6 text-sm",
              r.bold && "border-t border-border pt-2 text-base font-semibold",
            )}
          >
            <dt className={cn(r.bold ? "text-foreground" : "text-muted-foreground")}>{r.label}</dt>
            <dd className="font-mono tabular-nums">
              {r.negative && r.value > 0 ? "−" : ""}
              {formatNaira(r.value)}
            </dd>
          </div>
        ))}
      </dl>
      {note && <p className="w-full text-right text-xs text-muted-foreground">{note}</p>}
      {words && (
        <p className="w-full text-right text-xs text-muted-foreground">
          <span className="font-medium text-foreground/70">Amount in words: </span>
          {words}
        </p>
      )}
    </div>
  );
}
