"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function StatusFilter({
  options,
  paramName = "status",
  allLabel = "All statuses",
}: {
  options: { value: string; label: string }[];
  paramName?: string;
  allLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? "all";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(paramName);
    else params.set(paramName, value);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[9.5rem]">
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
