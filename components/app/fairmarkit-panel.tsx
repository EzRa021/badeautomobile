"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/app/form-field";
import { ReferenceChip } from "@/components/app/reference-chip";
import {
  FAIRMARKIT_DEFAULT_CURRENCY,
  FAIRMARKIT_DEFAULT_DELIVERY_DAYS,
  FAIRMARKIT_DEFAULT_VALID_DAYS,
  FAIRMARKIT_NIL,
  type FairmarkitSource,
} from "@/lib/fairmarkit/schema";

function MetaRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1">
      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

/**
 * The bid-response header the exported sheet carries back to Fairmarkit. The
 * buyer's own columns are fixed ("do not modify"), so only the quote validity,
 * currency and lead time are editable here.
 */
export function FairmarkitPanel({
  source,
  onChange,
  onRemove,
}: {
  source: FairmarkitSource;
  onChange: (next: FairmarkitSource) => void;
  onRemove: () => void;
}) {
  const { meta } = source;

  function setMeta(patch: Partial<FairmarkitSource["meta"]>) {
    onChange({ ...source, meta: { ...meta, ...patch } });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2">
            Fairmarkit RFQ
            {meta.rfq_id && <ReferenceChip>{meta.rfq_id}</ReferenceChip>}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {source.lines.length} line{source.lines.length === 1 ? "" : "s"} imported — the
            export sends this sheet back with your prices.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground"
        >
          <X /> Detach
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        <dl className="divide-y divide-border/60 text-sm">
          <MetaRow label="Buyer" value={meta.buyer_name} />
          <MetaRow label="Title" value={meta.title} />
          <MetaRow label="Closes" value={meta.scheduled_close} />
          <MetaRow label="Ship to" value={meta.shipping_address} />
        </dl>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField label="Valid for (days)" htmlFor="fm_valid_days">
            <Input
              id="fm_valid_days"
              type="number"
              min={0}
              inputMode="numeric"
              value={meta.valid_days}
              onChange={(e) =>
                setMeta({
                  valid_days: Number(e.target.value) || FAIRMARKIT_DEFAULT_VALID_DAYS,
                })
              }
            />
          </FormField>
          <FormField label="Currency" htmlFor="fm_currency">
            <Input
              id="fm_currency"
              value={meta.currency}
              maxLength={3}
              className="uppercase"
              onChange={(e) =>
                setMeta({
                  currency: e.target.value.toUpperCase() || FAIRMARKIT_DEFAULT_CURRENCY,
                })
              }
            />
          </FormField>
          <FormField
            label="Delivery days"
            htmlFor="fm_delivery_days"
            hint="Lead time sent on every line"
          >
            <Input
              id="fm_delivery_days"
              type="number"
              min={0}
              inputMode="numeric"
              value={meta.delivery_days}
              onChange={(e) =>
                setMeta({
                  delivery_days: Number(e.target.value) || FAIRMARKIT_DEFAULT_DELIVERY_DAYS,
                })
              }
            />
          </FormField>
        </div>

        <p className="text-xs text-muted-foreground">
          Manufacturer, MFG part # and supplier part # go out as{" "}
          <span className="font-mono">{FAIRMARKIT_NIL}</span>. Lines you leave unpriced are
          sent as “No bid”.
        </p>
      </CardContent>
    </Card>
  );
}
