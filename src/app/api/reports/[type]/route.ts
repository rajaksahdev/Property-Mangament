import { auth } from "@/auth";
import {
  buildDuesReport,
  buildIncomeReport,
  buildOccupancyReport,
  buildTenantLedger,
  reportDateStamp,
} from "@/lib/reports/data";
import { renderReportToPdf } from "@/lib/reports/pdf";
import { renderReportToXlsx } from "@/lib/reports/excel";
import {
  REPORT_FORMATS,
  REPORT_TYPES,
  type ReportDocument,
  type ReportFormat,
  type ReportType,
} from "@/lib/reports/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<ReportFormat, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return new Response("Unauthorized", { status: 401 });
  }
  const ownerId = session.user.id;

  const { type } = await params;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "pdf";
  const tenantId = url.searchParams.get("tenantId") ?? undefined;

  if (!REPORT_TYPES.includes(type as ReportType)) {
    return new Response("Unknown report type", { status: 404 });
  }
  if (!REPORT_FORMATS.includes(format as ReportFormat)) {
    return new Response("Unsupported format", { status: 400 });
  }

  let doc: ReportDocument | null = null;
  switch (type as ReportType) {
    case "income":
      doc = await buildIncomeReport(ownerId);
      break;
    case "dues":
      doc = await buildDuesReport(ownerId);
      break;
    case "occupancy":
      doc = await buildOccupancyReport(ownerId);
      break;
    case "tenant-ledger":
      if (!tenantId) {
        return new Response("tenantId is required", { status: 400 });
      }
      // buildTenantLedger enforces the tenant belongs to this owner.
      doc = await buildTenantLedger(ownerId, tenantId);
      if (!doc) return new Response("Tenant not found", { status: 404 });
      break;
  }

  if (!doc) return new Response("Unknown report type", { status: 404 });

  const ext = format === "pdf" ? "pdf" : "xlsx";
  const filename = `${type}-report-${reportDateStamp()}.${ext}`;
  const body =
    format === "pdf"
      ? await renderReportToPdf(doc)
      : await renderReportToXlsx(doc);

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": CONTENT_TYPE[format as ReportFormat],
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
