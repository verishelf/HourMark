"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { importDealersFromCsv } from "@/actions/dealers";

export function DealerCsvImport({ adminId }: { adminId: string }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    setImporting(true);
    const res = await importDealersFromCsv(adminId, text);
    setImporting(false);

    if ("error" in res && res.error) {
      toast.error(String(res.error));
      return;
    }

    setResult({ created: res.created ?? 0, skipped: res.skipped ?? 0, errors: res.errors ?? [] });
    toast.success(`Imported ${res.created} dealers`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bulk CSV Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Required columns: Company Name, Contact Name, Email, Phone, Website, Instagram, City, Country, Inventory Value.
          Duplicates are matched by email, website, or Instagram.
        </p>
        <div>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            id="dealer-csv-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button asChild disabled={importing}>
            <label htmlFor="dealer-csv-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Importing..." : "Upload CSV"}
            </label>
          </Button>
        </div>
        {result && (
          <div className="rounded-md border border-border p-4 text-sm space-y-2">
            <p><strong>{result.created}</strong> dealers created</p>
            <p><strong>{result.skipped}</strong> skipped (duplicates or errors)</p>
            {result.errors.length > 0 && (
              <ul className="text-destructive text-xs space-y-1 mt-2">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
