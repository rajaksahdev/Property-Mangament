import Link from "next/link";

import { getDuesAging, type DuesRow } from "@/lib/dashboard/queries";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BUCKET_STYLES: Record<DuesRow["bucket"], string> = {
  "0-30": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "31-60": "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  "60+": "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export async function DuesTable({ ownerId }: { ownerId: string }) {
  const { rows, buckets, total } = await getDuesAging(ownerId);

  const bucketCards: { label: string; key: DuesRow["bucket"] }[] = [
    { label: "0–30 days", key: "0-30" },
    { label: "31–60 days", key: "31-60" },
    { label: "60+ days", key: "60+" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dues &amp; aging</CardTitle>
        <CardDescription>
          {formatCurrency(total)} outstanding across {rows.length} payment
          {rows.length === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {bucketCards.map(({ label, key }) => (
            <div key={key} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p
                className={cn(
                  "mt-1 text-lg font-semibold",
                  buckets[key] > 0 && key === "60+" && "text-red-600",
                )}
              >
                {formatCurrency(buckets[key])}
              </p>
            </div>
          ))}
        </div>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No outstanding dues. 🎉
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/tenants/${row.tenantId}`}
                      className="font-medium hover:underline"
                    >
                      {row.tenant}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.property}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.period}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-transparent", BUCKET_STYLES[row.bucket])}>
                      {row.days}d
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
