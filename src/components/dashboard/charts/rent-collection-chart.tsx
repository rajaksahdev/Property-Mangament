"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";

export function RentCollectionChart({
  data,
}: {
  data: { month: string; collected: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) =>
            v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`
          }
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), "Collected"]}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="collected"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
