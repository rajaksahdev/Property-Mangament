"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

import type { PropertyStatus } from "@/generated/prisma/enums";

export type MapProperty = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  status: PropertyStatus;
};

const STATUS_COLOR: Record<PropertyStatus, string> = {
  OCCUPIED: "#2563eb",
  VACANT: "#059669",
  MAINTENANCE: "#d97706",
};

const STATUS_LABEL: Record<PropertyStatus, string> = {
  OCCUPIED: "Occupied",
  VACANT: "Vacant",
  MAINTENANCE: "Maintenance",
};

// A colored dot marker built from HTML — avoids loading Leaflet's default
// marker PNGs from a CDN (which fails offline).
function pin(status: PropertyStatus) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${STATUS_COLOR[status]};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function FitBounds({ properties }: { properties: MapProperty[] }) {
  const map = useMap();
  useEffect(() => {
    if (properties.length === 0) return;
    const bounds = L.latLngBounds(properties.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [map, properties]);
  return null;
}

export default function PropertiesMapInner({
  properties,
}: {
  properties: MapProperty[];
}) {
  const center: [number, number] = properties[0]
    ? [properties[0].lat, properties[0].lng]
    : [20.5937, 78.9629]; // India centroid fallback

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={pin(p.status)}>
            <Popup>
              <span className="font-medium">{p.title}</span>
              <br />
              <span style={{ color: STATUS_COLOR[p.status] }}>
                {STATUS_LABEL[p.status]}
              </span>
            </Popup>
          </Marker>
        ))}
        <FitBounds properties={properties} />
      </MapContainer>
    </div>
  );
}
