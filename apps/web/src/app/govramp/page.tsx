"use client";

import { useMemo, useRef, useState } from "react";
import {
  Rocket,
  AlertTriangle,
  CheckCircle2,
  Upload,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import {
  useGovRAMPDashboard,
  useUpdateGovRAMPProgress,
  useImportJourneyCsv,
  useGovRAMPFeedback,
  useUploadGovRAMPFeedback,
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_LABELS, TIER_COLORS } from "@/lib/types";

const TIER_ORDER = ["ps", "ready", "core", "authorized"];

export default function GovRAMPJourneyPage() {
  const { data: dashboard, isLoading } = useGovRAMPDashboard();
  const updateProgress = useUpdateGovRAMPProgress();
  const importCsv = useImportJourneyCsv();
  const { data: feedback, isLoading: isFeedbackLoading } = useGovRAMPFeedback();
  const uploadFeedback = useUploadGovRAMPFeedback();

  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [pctInput, setPctInput] = useState("");
  const [missingInput, setMissingInput] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdate = async (tier: string) => {
    const pct = parseFloat(pctInput);
    if (isNaN(pct) || pct < 0 || pct > 100) return;

    const missing = missingInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    await updateProgress.mutateAsync({
      tier,
      body: {
        completion_pct: pct,
        missing_control_ids: missing.length > 0 ? missing : undefined,
      },
    });
    setEditingTier(null);
    setPctInput("");
    setMissingInput("");
  };

  const handleImportCsv = async () => {
    const result = await importCsv.mutateAsync();
    setImportResult(
      `Imported ${result.imported_snapshots} snapshots. Latest period: ${result.latest_period || "N/A"}`
    );
  };

  const handleUploadFeedback = async () => {
    if (!selectedFile) return;
    setUploadMessage(null);
    try {
      const res = await uploadFeedback.mutateAsync(selectedFile);
      setUploadMessage(
        `Imported ${res.imported} feedback rows${res.latest_period ? ` · Latest period ${res.latest_period}` : ""}`
      );
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadMessage(`Error: ${message}`);
    }
  };

  const tiers = dashboard?.tiers || [];
  const snapshots = dashboard?.snapshots || [];
  const feedbackRows = feedback || [];

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of feedbackRows) {
      const label = (row.latest_status || (row.control_completed ? "Pass" : "Fail")).trim();
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [feedbackRows]);

  const latestFeedbackPeriod = useMemo(() => {
    let latest: string | null = null;
    for (const row of feedbackRows) {
      if (!row.latest_period) continue;
      if (!latest || row.latest_period > latest) {
        latest = row.latest_period;
      }
    }
    return latest;
  }, [feedbackRows]);

  const sortedTiers = TIER_ORDER.map((t) => tiers.find((tier) => tier.tier === t)).filter(
    Boolean
  ) as NonNullable<(typeof tiers)[number]>[];

  const getStatusClasses = (status?: string | null) => {
    if (!status) return "bg-slate-200 text-slate-700";
    const lowered = status.toLowerCase();
    if (lowered.includes("fail")) return "bg-red-100 text-red-700 border border-red-200";
    if (lowered.includes("concern")) return "bg-amber-100 text-amber-700 border border-amber-200";
    if (lowered.includes("pass")) return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    return "bg-slate-200 text-slate-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">GovRAMP Journey</h1>
          <p className="text-sm text-muted-foreground">
            Track your progress across GovRAMP tiers: PS (40), Ready (80), Core
            (60), Authorized (319)
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleImportCsv}
          disabled={importCsv.isPending}
        >
          <Upload className="h-4 w-4 mr-1" />
          {importCsv.isPending ? "Importing..." : "Import Journey CSV"}
        </Button>
      </div>

      {importResult && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
          <CheckCircle2 className="h-4 w-4" />
          {importResult}
        </div>
      )}

      <Card className="border-dashed border-2 border-navy/30 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-navy">
            <FileSpreadsheet className="h-5 w-5" />
            GovRAMP PMO Feedback Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Drop the latest PMO feedback export to sync pass/fail decisions, analyst notes, and missing evidence.
            Atelier will replace any existing feedback with this upload so you always see the freshest guidance.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setSelectedFile(file ?? null);
                setUploadMessage(null);
              }}
              className="sm:max-w-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="cta"
              onClick={handleUploadFeedback}
              disabled={!selectedFile || uploadFeedback.isPending}
            >
              {uploadFeedback.isPending ? (
                <span className="flex items-center gap-2 text-xs uppercase tracking-wide">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading
                </span>
              ) : (
                <span className="text-xs uppercase tracking-wide">Upload PMO CSV</span>
              )}
            </Button>
            {selectedFile && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                {selectedFile.name}
              </span>
            )}
          </div>
          {uploadMessage && (
            <div
              className={`text-xs rounded px-3 py-2 inline-flex items-center gap-2 ${uploadMessage.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {uploadMessage}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>Latest period: {latestFeedbackPeriod || "—"}</span>
            <span>Rows synced: {feedbackRows.length}</span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading GovRAMP data...</p>
      ) : (
        <>
          {/* Tier Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedTiers.map((tier) => (
              <Card key={tier.tier}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Rocket className="h-4 w-4 text-navy" />
                      {TIER_LABELS[tier.tier] || tier.tier}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {tier.total_controls} controls
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {tier.completed_controls} / {tier.total_controls}
                      </span>
                      <span className="font-bold text-navy">
                        {tier.completion_pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${TIER_COLORS[tier.tier] || "bg-blue-500"}`}
                        style={{ width: `${Math.min(tier.completion_pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Missing controls */}
                  {tier.missing_control_ids &&
                    tier.missing_control_ids.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                          Missing Controls:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {tier.missing_control_ids.map((cid) => (
                            <Badge
                              key={cid}
                              variant="destructive"
                              className="text-[9px]"
                            >
                              {cid}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Edit button / form */}
                  {editingTier === tier.tier ? (
                    <div className="space-y-2 pt-2 border-t">
                      <div>
                        <label className="text-[10px] text-muted-foreground">
                          Completion %
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={pctInput}
                          onChange={(e) => setPctInput(e.target.value)}
                          placeholder="e.g. 88"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">
                          Missing Controls (comma-separated)
                        </label>
                        <Input
                          value={missingInput}
                          onChange={(e) => setMissingInput(e.target.value)}
                          placeholder="e.g. IA-05, AC-02, SI-04"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="cta"
                          onClick={() => handleUpdate(tier.tier)}
                          disabled={updateProgress.isPending}
                          className="text-xs"
                        >
                          {updateProgress.isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingTier(null)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingTier(tier.tier);
                        setPctInput(tier.completion_pct.toString());
                        setMissingInput(
                          (tier.missing_control_ids || []).join(", ")
                        );
                      }}
                      className="w-full text-xs"
                    >
                      Update Progress
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Snapshot History */}
          {snapshots.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Snapshot History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium text-navy">
                          Period
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-navy">
                          Snapshot Score
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-navy">
                          Core
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-navy">
                          Ready
                        </th>
                        <th className="px-4 py-2 text-center font-medium text-navy">
                          Authorized
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshots.map((s) => (
                        <tr key={s.id} className="border-b">
                          <td className="px-4 py-2 font-mono">{s.period}</td>
                          <td className="px-4 py-2 text-center font-bold">
                            {s.snapshot_score != null
                              ? `${s.snapshot_score.toFixed(2)}%`
                              : "—"}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {s.core_implemented}/{s.core_required}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {s.ready_implemented}/{s.ready_required}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {s.authorized_implemented}/{s.authorized_required}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-base">
            <span>PMO Feedback Breakdown</span>
            <span className="text-xs font-normal text-muted-foreground">
              Status insights derived from the latest uploaded CSV
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {isFeedbackLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Fetching PMO feedback…
            </div>
          ) : feedbackRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Upload a PMO feedback CSV to populate pass/fail controls and analyst guidance.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {statusCounts.map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-lg border bg-muted/30 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    <span className="block text-[10px] text-muted-foreground">{status}</span>
                    <span className="text-lg font-semibold text-navy">{count}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Control</th>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide">Status</th>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">
                        Latest Feedback
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide hidden md:table-cell">
                        Issues / Gaps
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide hidden xl:table-cell">
                        Month Last Passed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackRows.map((row) => (
                      <tr key={row.id} className="border-t align-top">
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-navy">{row.control_id}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.control_name || "—"}
                          </div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {row.family || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${getStatusClasses(row.latest_status)}`}>
                            {row.latest_status || (row.control_completed ? "Pass" : "Fail")}
                          </span>
                          <div className="mt-2 text-[10px] text-muted-foreground">
                            Score: {row.score != null ? `${row.score.toFixed(2)}%` : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground whitespace-pre-wrap">
                          {row.latest_feedback || "—"}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {row.issues && row.issues.length > 0 ? (
                            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                              {row.issues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                          {row.month_last_passed || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
