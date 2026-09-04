import { cn } from "@/lib/utils/cn";

type Tone = "slate" | "green" | "amber" | "red" | "blue";

const TONE: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-sky-50 text-sky-700 border-sky-200",
};

// Every status across all document types → tone + display label.
const STATUS: Record<string, { tone: Tone; label: string }> = {
  draft: { tone: "slate", label: "Draft" },
  sent: { tone: "amber", label: "Sent" },
  accepted: { tone: "green", label: "Accepted" },
  rejected: { tone: "red", label: "Rejected" },
  invoiced: { tone: "blue", label: "Invoiced" },
  unpaid: { tone: "amber", label: "Unpaid" },
  partial: { tone: "blue", label: "Part-paid" },
  paid: { tone: "green", label: "Paid" },
  received: { tone: "green", label: "Received" },
  cancelled: { tone: "slate", label: "Cancelled" },
  completed: { tone: "green", label: "Completed" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = STATUS[status] ?? { tone: "slate" as Tone, label: status };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE[cfg.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  );
}
