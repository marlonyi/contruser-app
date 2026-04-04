// Export utilities for DataTable component

export interface ExportColumn<T> {
  key: keyof T;
  header: string;
  transform?: (value: unknown, item: T) => string | number;
}

/**
 * Converts data to CSV format and triggers download
 */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      const transformed = col.transform ? col.transform(value, item) : value;
      // Escape quotes and wrap in quotes if contains comma
      const str = String(transformed ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  // Add BOM for Excel compatibility
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Converts data to simple Excel-compatible format (TSV) and triggers download
 * Note: For full Excel support, consider using a library like xlsx
 */
export function downloadExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      const transformed = col.transform ? col.transform(value, item) : value;
      return String(transformed ?? "");
    })
  );

  // Use tab-separated values for Excel compatibility
  const tsv = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");

  const blob = new Blob(["\ufeff" + tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
  downloadBlob(blob, `${filename}.xls`);
}

/**
 * Triggers file download in browser
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}