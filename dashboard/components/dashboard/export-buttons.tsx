"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV, exportToExcel } from "@/lib/export";

export function ExportButtons<T extends Record<string, unknown>>({
  data,
  filename,
}: {
  data: T[];
  filename: string;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToCSV(data, filename)}
        disabled={data.length === 0}
      >
        <Download className="h-4 w-4" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToExcel(data, filename)}
        disabled={data.length === 0}
      >
        <Download className="h-4 w-4" />
        Excel
      </Button>
    </div>
  );
}
