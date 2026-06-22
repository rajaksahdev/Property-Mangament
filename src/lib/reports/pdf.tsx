import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type { ReportDocument, ReportTable } from "./types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 40,
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#64748b", marginTop: 2 },
  generated: { fontSize: 8, color: "#94a3b8", marginTop: 2 },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  summaryItem: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 110,
  },
  summaryLabel: { fontSize: 8, color: "#64748b" },
  summaryValue: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 2 },
  tableTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 6,
  },
  table: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cell: { paddingVertical: 5, paddingHorizontal: 8, flex: 1 },
  headerCell: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

function Table({ table }: { table: ReportTable }) {
  const align = table.align ?? [];
  return (
    <View wrap>
      {table.title && <Text style={styles.tableTitle}>{table.title}</Text>}
      <View style={styles.table}>
        <View style={styles.headerRow} fixed>
          {table.columns.map((col, i) => (
            <Text
              key={i}
              style={[
                styles.cell,
                styles.headerCell,
                { textAlign: align[i] === "right" ? "right" : "left" },
              ]}
            >
              {col}
            </Text>
          ))}
        </View>
        {table.rows.length === 0 ? (
          <View style={styles.row}>
            <Text style={[styles.cell, { color: "#94a3b8" }]}>
              No records.
            </Text>
          </View>
        ) : (
          table.rows.map((row, ri) => (
            <View key={ri} style={styles.row} wrap={false}>
              {row.map((value, ci) => (
                <Text
                  key={ci}
                  style={[
                    styles.cell,
                    { textAlign: align[ci] === "right" ? "right" : "left" },
                  ]}
                >
                  {String(value)}
                </Text>
              ))}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function ReportPdf({ doc }: { doc: ReportDocument }) {
  return (
    <Document title={doc.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{doc.title}</Text>
        {doc.subtitle && <Text style={styles.subtitle}>{doc.subtitle}</Text>}
        <Text style={styles.generated}>Generated {doc.generatedAt}</Text>

        {doc.summary && doc.summary.length > 0 && (
          <View style={styles.summaryRow}>
            {doc.summary.map((item, i) => (
              <View key={i} style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {doc.tables.map((table, i) => (
          <Table key={i} table={table} />
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Property Manager · Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export async function renderReportToPdf(
  doc: ReportDocument,
): Promise<Buffer> {
  return renderToBuffer(<ReportPdf doc={doc} />);
}
