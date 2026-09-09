"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FairmarkitImport } from "@/lib/fairmarkit/parse";

/**
 * Upload the .xlsx bid sheet downloaded from a Fairmarkit RFQ and hand the
 * parsed lines back to the quotation form.
 */
export function ImportFairmarkitButton({
  onImport,
  className,
}: {
  onImport: (result: FairmarkitImport) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/import/fairmarkit", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't read that Fairmarkit sheet.");
        return;
      }
      const result = data as FairmarkitImport;
      onImport(result);
      toast.success(
        `Imported ${result.items.length} line${result.items.length === 1 ? "" : "s"}${
          result.source.meta.rfq_id ? ` from RFQ ${result.source.meta.rfq_id}` : ""
        } — enter your prices`,
      );
    } catch {
      toast.error("Couldn't read that Fairmarkit sheet.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
        {loading ? "Reading sheet…" : "Import Fairmarkit sheet"}
      </Button>
    </>
  );
}
