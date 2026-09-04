"use client";

import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";

export interface PartyOption {
  id: string;
  name: string;
  address: string | null;
}

export interface PartyValue {
  id: string;
  name: string;
  address: string;
}

/**
 * Controlled customer/supplier picker. Selecting an existing record auto-fills
 * name + address (still editable), and the values are kept in the parent's state
 * so they can be restored from a draft.
 */
export function PartyPicker({
  label,
  idName,
  nameName,
  addressName,
  options,
  value,
  onChange,
  errors,
}: {
  label: string; // "Customer" | "Supplier"
  idName: string;
  nameName: string;
  addressName: string;
  options: PartyOption[];
  value: PartyValue;
  onChange: (next: PartyValue) => void;
  errors?: { name?: string };
}) {
  function onSelect(id: string) {
    const opt = options.find((o) => o.id === id);
    onChange(opt ? { id, name: opt.name, address: opt.address ?? "" } : { ...value, id });
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label={`${label} on file`} htmlFor={idName} hint="Pick to auto-fill, or type below">
        <NativeSelect id={idName} name={idName} value={value.id} onChange={(e) => onSelect(e.target.value)}>
          <option value="">— New / one-off {label.toLowerCase()} —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </NativeSelect>
      </FormField>

      <FormField label={`${label} name`} htmlFor={nameName} required error={errors?.name}>
        <Input
          id={nameName}
          name={nameName}
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder={`${label} name`}
          required
        />
      </FormField>

      <FormField label="Address" htmlFor={addressName} className="sm:col-span-2">
        <Textarea
          id={addressName}
          name={addressName}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Address (appears on the document)"
          rows={2}
        />
      </FormField>
    </div>
  );
}
