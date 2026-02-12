"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useImportCrosswalk } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportsPage() {
  const importCrosswalk = useImportCrosswalk();
  const crosswalkRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
  } | null>(null);

  const handleCrosswalkUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importCrosswalk.mutateAsync(file);
    setImportResult(result);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Imports</h1>
        <p className="text-sm text-muted-foreground">
          Import crosswalk data and other configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crosswalk Import */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-navy" />
              SOC 2 Crosswalk CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV with columns:{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                nist_control_id, soc2_target, evidence_objective
              </code>
            </p>
            <Button
              variant="cta"
              onClick={() => crosswalkRef.current?.click()}
              disabled={importCrosswalk.isPending}
            >
              <Upload className="h-4 w-4 mr-1" />
              {importCrosswalk.isPending
                ? "Importing..."
                : "Upload Crosswalk CSV"}
            </Button>
            <input
              ref={crosswalkRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCrosswalkUpload}
            />
            {importResult && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
                <CheckCircle2 className="h-4 w-4" />
                Imported {importResult.imported} crosswalk mappings
              </div>
            )}
            {importCrosswalk.isError && (
              <p className="text-sm text-destructive">
                {(importCrosswalk.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* GovRAMP Excel Import Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-navy" />
              GovRAMP Excel Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import GovRAMP workbook data to populate boards and control
              mappings. (Coming soon)
            </p>
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4 mr-1" />
              Upload GovRAMP Excel
            </Button>
            <p className="text-xs text-muted-foreground italic">
              This feature is planned for a future release.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
