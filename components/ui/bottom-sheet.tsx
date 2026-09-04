"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils/cn";

/** A mobile bottom sheet (slides up from the bottom). Built on Radix Dialog. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4 shadow-xl focus:outline-none",
            "pb-[calc(1rem+env(safe-area-inset-bottom))]",
            className,
          )}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden />
          {title ? (
            <DialogPrimitive.Title className="mb-3 px-1 font-display text-base font-semibold">
              {title}
            </DialogPrimitive.Title>
          ) : (
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
