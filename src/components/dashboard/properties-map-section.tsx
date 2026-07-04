import { MapPin } from "lucide-react";

import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PropertiesMap } from "./properties-map";

export async function PropertiesMapSection({ ownerId }: { ownerId: string }) {
  const properties = await db.property.findMany({
    where: { ownerId },
    select: { id: true, title: true, lat: true, lng: true, status: true },
  });

  const located = properties.flatMap((p) =>
    p.lat !== null && p.lng !== null
      ? [{ id: p.id, title: p.title, lat: p.lat, lng: p.lng, status: p.status }]
      : [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="size-4" /> Property locations
        </CardTitle>
        <CardDescription>
          {located.length} of {properties.length} propert
          {properties.length === 1 ? "y" : "ies"} mapped
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PropertiesMap properties={located} />
      </CardContent>
    </Card>
  );
}
