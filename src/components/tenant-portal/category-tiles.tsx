import Link from "next/link";
import {
  Briefcase,
  Building2,
  Hotel,
  LayoutGrid,
  Home,
  Trees,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TILES: { type?: string; label: string; icon: LucideIcon }[] = [
  { type: undefined, label: "All", icon: LayoutGrid },
  { type: "FLAT", label: "Flats", icon: Building2 },
  { type: "OFFICE", label: "Offices", icon: Briefcase },
  { type: "LAND", label: "Land", icon: Trees },
  { type: "RESORT", label: "Resorts", icon: Hotel },
  { type: "SOCIETY", label: "Society", icon: Home },
];

export function CategoryTiles({
  activeType,
  baseParams,
}: {
  activeType?: string;
  baseParams: { q?: string; minPrice?: string; maxPrice?: string };
}) {
  function href(type?: string) {
    const params = new URLSearchParams();
    if (baseParams.q) params.set("q", baseParams.q);
    if (baseParams.minPrice) params.set("minPrice", baseParams.minPrice);
    if (baseParams.maxPrice) params.set("maxPrice", baseParams.maxPrice);
    if (type) params.set("type", type);
    const qs = params.toString();
    return qs ? `/home?${qs}` : "/home";
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {TILES.map(({ type, label, icon: Icon }) => {
        const active = activeType === type || (!activeType && !type);
        return (
          <Link
            key={label}
            href={href(type)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary/5 text-foreground"
                : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
