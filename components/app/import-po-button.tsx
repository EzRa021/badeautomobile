"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ParsedPo } from "@/lib/pdf/parse-nestle-po";

export function ImportPoButton({ onImport }: { onImport: (p: ParsedPo) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/import/nestle-po", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't import that PO.");
        return;
      }
      onImport(data as ParsedPo);
      toast.success(`Imported ${data.items?.length ?? 0} item(s) from the purchase order`);
    } catch {
      toast.error("Couldn't import that PO.");
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
        accept="application/pdf"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Upload />}
        {loading ? "Reading PO…" : "Import from PO (PDF)"}
      </Button>
    </>
  );
}
