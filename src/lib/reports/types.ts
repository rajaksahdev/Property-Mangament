export type ReportTable = {
  title?: string;
  columns: string[];
  /** Per-column alignment; defaults to "left". */
  align?: ("left" | "right")[];
  rows: (string | number)[][];
};

export type ReportSummaryItem = { label: string; value: string };

export type ReportDocument = {
  title: string;
  subtitle?: string;
  generatedAt: string;
  summary?: ReportSummaryItem[];
  tables: ReportTable[];
};

export const REPORT_TYPES = [
  "income",
  "dues",
  "occupancy",
  "tenant-ledger",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_FORMATS = ["pdf", "xlsx"] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];
