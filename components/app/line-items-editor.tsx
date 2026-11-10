"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiscountInput } from "@/components/app/discount-input";
import { cn } from "@/lib/utils/cn";
import { normalizeDiscountType, type DiscountType } from "@/lib/utils/discount";

export type Row = Record<string, string>;

export interface ColumnDef {
  key: string;
  label: string;
  /**
   * "discount" renders a number + %/₦ switch. The number lives in `row[key]`,
   * the switch in `row[typeKey]` (default `${key}_type`).
   */
  kind?: "text" | "number" | "money" | "discount";
  typeKey?: string;
  align?: "left" | "right";
  width?: string; // e.g. "8rem"
  placeholder?: string;
  computed?: boolean; // read-only derived value
  /** Display value for a computed column, derived from the whole row. */
  value?: (row: Row) => string;
  /** Returns a message when the cell's value is not acceptable. */
  invalid?: (row: Row) => string | null;
  grow?: boolean; // takes remaining space (description)
}

export function emptyRow(columns: ColumnDef[]): Row {
  return Object.fromEntries(columns.map((c) => [c.key, ""]));
}

export function LineItemsEditor({
  columns,
  rows,
  onChange,
  deriveRow,
  minRows = 1,
  minWidth = "640px",
}: {
  columns: ColumnDef[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  /** Recompute derived columns after an edit. */
  deriveRow?: (row: Row) => Row;
  minRows?: number;
  /** Narrowest the table gets before it scrolls sideways. */
  minWidth?: string;
}) {
  function update(index: number, key: string, value: string) {
    const next = rows.map((r, i) => {
      if (i !== index) return r;
      const merged = { ...r, [key]: value };
      return deriveRow ? deriveRow(merged) : merged;
    });
    onChange(next);
  }

  function addRow() {
    onChange([...rows, emptyRow(columns)]);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length ? next : [emptyRow(columns)]);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-border">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="w-8 px-2 py-2" />
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn("px-2 py-2 font-semibold", c.align === "right" ? "text-right" : "text-left")}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border/70 last:border-0">
                <td className="px-2 py-1.5 text-center align-middle text-muted-foreground">
                  <GripVertical className="mx-auto size-4 opacity-40" />
                </td>
                {columns.map((c) => {
                  const problem = c.invalid?.(row) ?? null;
                  return (
                    <td key={c.key} className="px-1.5 py-1.5 align-middle">
                      {c.kind === "discount" ? (
                        <DiscountInput
                          size="sm"
                          value={row[c.key] ?? ""}
                          type={normalizeDiscountType(row[c.typeKey ?? `${c.key}_type`])}
                          onValueChange={(v) => update(i, c.key, v)}
                          onTypeChange={(t: DiscountType) => update(i, c.typeKey ?? `${c.key}_type`, t)}
                          invalid={problem != null}
                          title={problem ?? undefined}
                          aria-label={c.label}
                        />
                      ) : (
                        <Input
                          value={c.value ? c.value(row) : (row[c.key] ?? "")}
                          onChange={(e) => update(i, c.key, e.target.value)}
                          placeholder={c.placeholder}
                          readOnly={c.computed}
                          inputMode={c.kind === "money" || c.kind === "number" ? "decimal" : undefined}
                          className={cn(
                            "h-8 border-transparent bg-transparent px-2 shadow-none focus-visible:border-ring focus-visible:bg-card",
                            c.align === "right" && "text-right tnum",
                            c.computed && "text-muted-foreground",
                            c.kind === "money" && "font-mono",
                          )}
                          aria-label={c.label}
                        />
                      )}
                    </td>
                  );
                })}
                <td className="px-1.5 py-1.5 text-center align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= minRows}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus /> Add item
      </Button>
    </div>
  );
}
