"use client";

import { useState } from "react";

import { ReportDownloadButton } from "@/components/reports/report-download-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TenantLedgerDownload({
  tenants,
}: {
  tenants: { id: string; name: string }[];
}) {
  const [tenantId, setTenantId] = useState("");

  const base = `/api/reports/tenant-ledger?tenantId=${tenantId}`;

  return (
    <div className="space-y-3">
      <Select value={tenantId} onValueChange={setTenantId}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a tenant" />
        </SelectTrigger>
        <SelectContent>
          {tenants.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No tenants yet
            </div>
          ) : (
            tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <ReportDownloadButton
          url={`${base}&format=pdf`}
          format="pdf"
          disabled={!tenantId}
        />
        <ReportDownloadButton
          url={`${base}&format=xlsx`}
          format="xlsx"
          disabled={!tenantId}
        />
      </div>
    </div>
  );
}
