"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updatePropertyStatus } from "@/lib/actions/property";
import { PROPERTY_STATUSES } from "@/lib/validations/property";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PropertyStatus } from "@/generated/prisma/enums";

const STATUS_LABELS: Record<PropertyStatus, string> = {
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
};

export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: PropertyStatus;
}) {
  const [value, setValue] = useState<PropertyStatus>(status);
  const [pending, startTransition] = useTransition();

  function handleChange(next: string) {
    const previous = value;
    const nextStatus = next as PropertyStatus;
    setValue(nextStatus); // optimistic
    startTransition(async () => {
      const result = await updatePropertyStatus(id, nextStatus);
      if (result?.error) {
        setValue(previous);
        toast.error(result.error);
      } else {
        toast.success(`Marked ${STATUS_LABELS[nextStatus].toLowerCase()}`);
      }
    });
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-[150px] gap-1.5 text-xs">
        {pending && <Loader2 className="size-3 animate-spin" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROPERTY_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
