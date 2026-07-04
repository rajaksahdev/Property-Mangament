"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

export function ListingFilters({
  initial,
  maxPrice,
}: {
  initial: { q?: string; minPrice?: string; maxPrice?: string; type?: string };
  maxPrice: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const bound = Math.max(10000, Math.ceil(maxPrice / 1000) * 1000);

  const [q, setQ] = useState(initial.q ?? "");
  const [range, setRange] = useState<[number, number]>([
    initial.minPrice ? Number(initial.minPrice) : 0,
    initial.maxPrice ? Number(initial.maxPrice) : bound,
  ]);

  function pushWith(params: URLSearchParams) {
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/home?${qs}` : "/home"));
  }

  function apply(event?: React.FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (initial.type) params.set("type", initial.type);
    if (q.trim()) params.set("q", q.trim());
    if (range[0] > 0) params.set("minPrice", String(range[0]));
    if (range[1] < bound) params.set("maxPrice", String(range[1]));
    pushWith(params);
  }

  // Live search: auto-apply the text query shortly after the user stops typing.
  const debouncedQ = useDebouncedValue(q, 400);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (initial.type) params.set("type", initial.type);
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (range[0] > 0) params.set("minPrice", String(range[0]));
    if (range[1] < bound) params.set("maxPrice", String(range[1]));
    pushWith(params);
    // Only react to debounced query changes; other filters apply via the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  function clear() {
    setQ("");
    setRange([0, bound]);
    const params = new URLSearchParams();
    if (initial.type) params.set("type", initial.type);
    pushWith(params);
  }

  return (
    <form
      onSubmit={apply}
      className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-end"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative self-end">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search location or title"
            className="pl-8"
            aria-label="Search listings"
          />
          {pending && (
            <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price range</span>
            <span className="font-medium">
              {formatCurrency(range[0])} – {formatCurrency(range[1])}
            </span>
          </div>
          <Slider
            value={range}
            onValueChange={(v) => setRange([v[0] ?? 0, v[1] ?? bound])}
            min={0}
            max={bound}
            step={1000}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />} Apply
        </Button>
        <Button type="button" variant="ghost" onClick={clear}>
          <X /> Clear
        </Button>
      </div>
    </form>
  );
}
