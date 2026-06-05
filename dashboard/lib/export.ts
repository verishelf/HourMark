import * as XLSX from "xlsx";

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    })
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = "Sheet1"
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadFile(
    new Blob([buffer]),
    `${filename}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
) {
  const blob =
    typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
