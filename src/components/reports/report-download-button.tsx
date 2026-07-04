"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Icon + label live here (not passed as props) because a Server Component can't
// hand a function/component across the boundary to this Client Component.
const FORMATS = {
  pdf: { label: "PDF", icon: FileText },
  xlsx: { label: "Excel", icon: FileSpreadsheet },
} as const;

/**
 * Downloads a server-generated report (PDF/Excel) via fetch→blob so we can show
 * a pending spinner and surface failures — unlike a bare `<a href>` which gives
 * no feedback while the server renders the file.
 */
export function ReportDownloadButton({
  url,
  format,
  fallbackFilename,
  disabled,
}: {
  url: string;
  format: keyof typeof FORMATS;
  fallbackFilename?: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const { label, icon: Icon } = FORMATS[format];

  async function download() {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const cd = res.headers.get("content-disposition");
      const name =
        cd?.match(/filename="?([^"]+)"?/)?.[1] ?? fallbackFilename ?? "report";

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={download}
      disabled={loading || disabled}
    >
      {loading ? <Loader2 className="animate-spin" /> : <Icon />} {label}
    </Button>
  );
}
