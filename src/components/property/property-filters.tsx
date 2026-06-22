"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    router.push(query ? `/properties?${query}` : "/properties");
  }

  function clear() {
    setQ("");
    setType("all");
    setStatus("all");
    setMinPrice("");
    setMaxPrice("");
    router.push("/properties");
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
        />
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
        <Button type="submit">
          <Search /> Apply filters
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
