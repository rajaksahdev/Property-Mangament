import ExcelJS from "exceljs";

import type { ReportDocument } from "./types";

function safeSheetName(name: string, fallback: string): string {
  // Excel sheet names: max 31 chars, no : \ / ? * [ ]
  const cleaned = name.replace(/[\\/?*:[\]]/g, " ").trim().slice(0, 31);
  return cleaned || fallback;
}

export async function renderReportToXlsx(
  doc: ReportDocument,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Property Manager";
  wb.created = new Date();

  doc.tables.forEach((table, index) => {
    const ws = wb.addWorksheet(
      safeSheetName(table.title ?? doc.title, `Sheet ${index + 1}`),
    );

    // Document title + meta (only on the first sheet).
    if (index === 0) {
      const titleRow = ws.addRow([doc.title]);
      titleRow.font = { bold: true, size: 14 };
      if (doc.subtitle) ws.addRow([doc.subtitle]);
      ws.addRow([`Generated ${doc.generatedAt}`]);
      if (doc.summary && doc.summary.length > 0) {
        ws.addRow([]);
        doc.summary.forEach((item) =>
          ws.addRow([item.label, item.value]),
        );
      }
      ws.addRow([]);
    }

    const headerRow = ws.addRow(table.columns);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
      cell.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };
    });

    table.rows.forEach((row) => {
      const added = ws.addRow(row);
      table.align?.forEach((a, i) => {
        if (a === "right") {
          added.getCell(i + 1).alignment = { horizontal: "right" };
        }
      });
    });

    // Auto-size columns to the longest value.
    ws.columns.forEach((column) => {
      let max = 10;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > max) max = len;
      });
      column.width = Math.min(max + 2, 48);
    });
  });

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
}
