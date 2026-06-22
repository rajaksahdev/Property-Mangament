"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS: Record<string, string> = {
  Occupied: "#2563eb",
  Vacant: "#10b981",
  Maintenance: "#f59e0b",
};

export function OccupancyDonut({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No properties yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value}`, String(name)]}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
