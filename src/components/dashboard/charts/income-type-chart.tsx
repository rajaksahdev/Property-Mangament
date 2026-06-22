"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";

export function IncomeTypeChart({
  data,
}: {
  data: { type: string; total: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No income recorded yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis
          dataKey="type"
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
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          formatter={(value) => [formatCurrency(Number(value)), "Income"]}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
