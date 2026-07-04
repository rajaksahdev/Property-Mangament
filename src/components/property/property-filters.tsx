"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/validations/property";

const TYPE_LABELS: Record<string, string> = {
  FLAT: "Flat",
  OFFICE: "Office",
  LAND: "Land",
  RESORT: "Resort",
  SOCIETY: "Society",
};
const STATUS_LABELS: Record<string, string> = {
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
};

export type FilterValues = {
  q?: string;
  type?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
};

export function PropertyFilters({ initial }: { initial: FilterValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q ?? "");
  const [type, setType] = useState(initial.type ?? "all");
  const [status, setStatus] = useState(initial.status ?? "all");
  const [minPrice, setMinPrice] = useState(initial.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice ?? "");

  function apply(event?: React.FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (type !== "all") params.set("type", type);
    if (status !== "all") params.set("status", status);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    // Note: `page` is intentionally dropped so new filters start on page 1.
    const query = params.toString();
    startTransition(() =>
      router.push(query ? `/properties?${query}` : "/properties"),
    );
  }

  // Live search: auto-apply the text query shortly after the user stops typing.
  const debouncedQ = useDebouncedValue(q, 400);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  function clear() {
    setQ("");
    setType("all");
    setStatus("all");
    setMinPrice("");
    setMaxPrice("");
    startTransition(() => router.push("/properties"));
  }

  const hasFilters =
    q !== "" ||
    type !== "all" ||
    status !== "all" ||
    minPrice !== "" ||
    maxPrice !== "";

  return (
    <form
      onSubmit={apply}
      className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="relative sm:col-span-2 lg:col-span-2">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or address"
          className="pl-8"
          aria-label="Search properties"
        />
        {pending && (
          <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {PROPERTY_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {PROPERTY_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        min={0}
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        placeholder="Min ₹"
      />
      <Input
        type="number"
        min={0}
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        placeholder="Max ₹"
      />

      <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />} Apply
          filters
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" onClick={clear}>
            <X /> Clear
          </Button>
        )}
      </div>
    </form>
  );
}
