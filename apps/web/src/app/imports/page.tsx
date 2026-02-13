"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useImportCrosswalk } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

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
      <PageHeader
        icon={Upload}
        title="Imports"
        description="Import crosswalk data and other configuration"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Crosswalk Import */}
        <Card className="hover:shadow-card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/6">
                <FileSpreadsheet className="h-4 w-4 text-navy" />
              </div>
              <div>
                <CardTitle className="text-section-title text-navy">
                  SOC 2 Crosswalk CSV
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Active</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Upload a CSV with columns:{" "}
              <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded-md font-mono">
                nist_control_id, soc2_target, evidence_objective
              </code>
            </p>
            <Button
              variant="cta"
              size="sm"
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
              <div className="flex items-center gap-2 text-[13px] text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                Imported {importResult.imported} crosswalk mappings
              </div>
            )}
            {importCrosswalk.isError && (
              <p className="text-[13px] text-destructive">
                {(importCrosswalk.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* GovRAMP Excel Import Placeholder */}
        <Card className="opacity-75">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-section-title text-muted-foreground">
                  GovRAMP Excel Import
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Coming soon</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Import GovRAMP workbook data to populate boards and control
              mappings.
            </p>
            <Button variant="outline" size="sm" disabled>
              <Upload className="h-4 w-4 mr-1" />
              Upload GovRAMP Excel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
