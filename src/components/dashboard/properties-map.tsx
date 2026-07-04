"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import type { MapProperty } from "./properties-map-inner";

// Leaflet touches `window`, so load the map client-only.
const Inner = dynamic(() => import("./properties-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-xl border bg-muted" />
  ),
});

const LEGEND: { label: string; color: string }[] = [
  { label: "Occupied", color: "#2563eb" },
  { label: "Vacant", color: "#059669" },
  { label: "Maintenance", color: "#d97706" },
];

export function PropertiesMap({ properties }: { properties: MapProperty[] }) {
  if (properties.length === 0) {
    return (
      <EmptyState
        compact
        icon={MapPin}
        title="No mapped properties"
        description="Add coordinates to a property to see it on the map."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Inner properties={properties} />
      <div className="flex flex-wrap gap-4">
        {LEGEND.map(({ label, color }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
