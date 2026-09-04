import { formatNaira } from "@/lib/utils/money";

/** Compact ₦ label, e.g. ₦1.2m / ₦450k. */
function compact(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
}

export function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div className="flex items-end gap-3">
        {data.map((d, i) => {
          const h = Math.max(2, Math.round((d.value / max) * 120));
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                {d.value > 0 ? compact(d.value) : ""}
              </span>
              <div
                className="w-full rounded-t-[3px] bg-primary/85 transition-colors"
                style={{ height: h }}
                title={`${d.label}: ${formatNaira(d.value)}`}
              />
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">No invoiced revenue yet.</p>
      )}
    </div>
  );
}
