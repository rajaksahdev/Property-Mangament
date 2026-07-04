import type { Metadata } from "next";
import {
  FileText,
  TrendingUp,
  TriangleAlert,
  Building2,
  type LucideIcon,
} from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { TenantLedgerDownload } from "@/components/reports/tenant-ledger-download";

export const metadata: Metadata = { title: "Reports · Property Manager" };

const REPORTS: {
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    type: "income",
    title: "Monthly income",
    description: "12-month rent collection and income by property type.",
    icon: TrendingUp,
  },
  {
    type: "dues",
    title: "Dues report",
    description: "Outstanding payments with 0–30 / 31–60 / 60+ aging.",
    icon: TriangleAlert,
  },
  {
    type: "occupancy",
    title: "Occupancy report",
    description: "Status and current tenant for every property.",
    icon: Building2,
  },
];

export default async function ReportsPage() {
  const session = await auth();
  const ownerId = session!.user.id;

  const tenants = await db.user.findMany({
    where: {
      role: "TENANT",
      leases: { some: { property: { ownerId } } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download reports as PDF or Excel.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {REPORTS.map(({ type, title, description, icon: Icon }) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="size-4 text-muted-foreground" /> {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <ReportDownloadButton
                  url={`/api/reports/${type}?format=pdf`}
                  format="pdf"
                />
                <ReportDownloadButton
                  url={`/api/reports/${type}?format=xlsx`}
                  format="xlsx"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-muted-foreground" /> Tenant ledger
            </CardTitle>
            <CardDescription>
              Full payment history for a specific tenant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TenantLedgerDownload tenants={tenants} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
