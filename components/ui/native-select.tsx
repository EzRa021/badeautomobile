import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** A native <select> styled to match Input — submits its value in forms without JS. */
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full appearance-none rounded-md border border-input bg-card px-3 py-1 pr-9 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
});
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
