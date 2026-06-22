"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TenantFilterValues = {
  q?: string;
  propertyId?: string;
  lease?: string;
  dues?: string;
};

export function TenantFilters({
  initial,
  properties,
}: {
  initial: TenantFilterValues;
  properties: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q ?? "");
  const [propertyId, setPropertyId] = useState(initial.propertyId ?? "all");
  const [lease, setLease] = useState(initial.lease ?? "all");
  const [dues, setDues] = useState(initial.dues === "yes");

  function apply(event?: React.FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (propertyId !== "all") params.set("propertyId", propertyId);
    if (lease !== "all") params.set("lease", lease);
    if (dues) params.set("dues", "yes");
    const query = params.toString();
    router.push(query ? `/tenants?${query}` : "/tenants");
  }

  function clear() {
    setQ("");
    setPropertyId("all");
    setLease("all");
    setDues(false);
    router.push("/tenants");
  }

  const hasFilters =
    q !== "" || propertyId !== "all" || lease !== "all" || dues;

  return (
    <form
      onSubmit={apply}
      className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="relative sm:col-span-2">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email"
          className="pl-8"
        />
      </div>

      <Select value={propertyId} onValueChange={setPropertyId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Property" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All properties</SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={lease} onValueChange={setLease}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Lease status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All leases</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <label className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
        <input
          type="checkbox"
          checked={dues}
          onChange={(e) => setDues(e.target.checked)}
          className="size-4 rounded border-input accent-primary"
        />
        <Label className="cursor-pointer">Has outstanding dues</Label>
      </label>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-2 lg:justify-end">
        <Button type="submit">
          <Search /> Apply
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
