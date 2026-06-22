"use client";

import { useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker asset paths break under bundlers, so point the icon
// at the pinned CDN build explicitly.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Center of India — a sensible default when no pin is set yet.
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const hasPin = lat !== null && lng !== null;
  // Only used for the initial mount — clicking moves the marker, not the view.
  const center = useMemo<[number, number]>(
    () => (hasPin ? [lat as number, lng as number] : DEFAULT_CENTER),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border">
      <MapContainer
        center={center}
        zoom={hasPin ? 14 : 4}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {hasPin && (
          <Marker position={[lat as number, lng as number]} icon={markerIcon} />
        )}
      </MapContainer>
    </div>
  );
}
