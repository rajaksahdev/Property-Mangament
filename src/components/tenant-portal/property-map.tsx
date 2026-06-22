"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so load the actual map client-only.
const Inner = dynamic(() => import("./property-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-xl border bg-muted" />
  ),
});

export function PropertyMap({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  if (lat === null || lng === null) return null;
  return <Inner lat={lat} lng={lng} />;
}
