"use client";

import { cn } from "@/lib/utils/cn";
import { type DiscountType } from "@/lib/utils/discount";

const OPTIONS: { value: DiscountType; symbol: string; label: string }[] = [
  { value: "percent", symbol: "%", label: "Percentage" },
  { value: "amount", symbol: "₦", label: "Fixed amount in naira" },
];

/**
 * One discount, entered as a number plus a %/₦ switch — the two sit in a single
 * bordered control so it reads as one field. Presentational only: the parent
 * owns the value and decides what is valid.
 */
export function DiscountInput({
  id,
  value,
  type,
  onValueChange,
  onTypeChange,
  invalid = false,
  title,
  size = "md",
  placeholder = "0",
  "aria-label": ariaLabel = "Discount",
  className,
}: {
  id?: string;
  value: string;
  type: DiscountType;
  onValueChange: (value: string) => void;
  onTypeChange: (type: DiscountType) => void;
  invalid?: boolean;
  /** Tooltip, used to explain why the value is invalid. */
  title?: string;
  size?: "sm" | "md";
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}) {
  const compact = size === "sm";

  return (
    <div
      title={title}
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-md border bg-card shadow-sm transition-colors",
        compact ? "h-8" : "h-9",
        invalid
          ? "border-destructive/60 focus-within:ring-2 focus-within:ring-destructive/20"
          : "border-input focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25",
        className,
      )}
    >
      <input
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        className={cn(
          "tnum w-0 min-w-0 flex-1 bg-transparent px-2.5 text-right font-mono outline-none placeholder:text-muted-foreground/60",
          invalid && "text-destructive",
        )}
      />
      <div
        role="radiogroup"
        aria-label={`${ariaLabel} type`}
        className="flex shrink-0 items-stretch border-l border-border bg-muted/40"
      >
        {OPTIONS.map((o) => {
          const active = type === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={o.label}
              title={o.label}
              onClick={() => onTypeChange(o.value)}
              className={cn(
                "grid w-7 place-items-center text-xs font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {o.symbol}
            </button>
          );
        })}
      </div>
    </div>
  );
}
