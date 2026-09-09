"use client";

import { FormField } from "@/components/app/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export interface VehicleOption {
  id: string;
  description: string;
  reg_no: string | null;
}

export interface VehicleValue {
  id: string;
  /** What the document prints. */
  label: string;
  /** Plate. */
  reg_no: string;
}

/**
 * Controlled vehicle field shared by every document form.
 *
 * Picking from the registry fills the description + plate; typing a vehicle that
 * isn't registered yet is fine too — the server action registers it on save, so
 * the vehicle's history page picks the document up either way.
 */
export function VehiclePicker({
  options,
  value,
  onChange,
  idName = "vehicle_id",
  labelName = "vehicle_label",
  regName = "vehicle_reg_no",
  labelHint = "Prints on the document",
  className,
}: {
  options: VehicleOption[];
  value: VehicleValue;
  onChange: (next: VehicleValue) => void;
  idName?: string;
  labelName?: string;
  regName?: string;
  labelHint?: string;
  className?: string;
}) {
  function onSelect(id: string) {
    const option = options.find((o) => o.id === id);
    onChange(
      option
        ? { id, label: option.description, reg_no: option.reg_no ?? "" }
        : { ...value, id: "" },
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField
          label="Vehicle on file"
          htmlFor={`${idName}_select`}
          hint="Pick, or type a new one"
        >
          <NativeSelect id={`${idName}_select`} value={value.id} onChange={(e) => onSelect(e.target.value)}>
            <option value="">— New / one-off vehicle —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.reg_no ? `${o.description} · ${o.reg_no}` : o.description}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <FormField label="Vehicle" htmlFor={labelName} hint={labelHint}>
          <Input
            id={labelName}
            name={labelName}
            value={value.label}
            onChange={(e) => onChange({ ...value, label: e.target.value })}
            placeholder="Toyota Prado"
          />
        </FormField>

        <FormField label="Registration / plate" htmlFor={regName} hint="Added to the registry">
          <Input
            id={regName}
            name={regName}
            value={value.reg_no}
            onChange={(e) => onChange({ ...value, reg_no: e.target.value })}
            placeholder="LSD 656 HD"
            className="font-mono uppercase"
          />
        </FormField>
      </div>
      <input type="hidden" name={idName} value={value.id} />
    </div>
  );
}
