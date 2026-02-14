"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Hexagon,
  Rocket,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Zap,
  TrendingUp,
  Loader2,
  Home,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";
import { useGovRAMPStats, useGovRAMPDashboard, useUploadGovRAMPFeedback } from "@/hooks/use-api";
import { TIER_LABELS } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/layout/skeleton";

const TIER_ORDER = ["ps", "core", "ready", "authorized"];

const TIER_RING_COLORS: Record<string, string> = {
  ps: "#3b82f6",
  core: "#f97316",
  ready: "#eab308",
  authorized: "#22c55e",
};

function DonutChart({
  pct,
  color,
  size = 110,
  strokeWidth = 9,
}: {
  pct: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGovRAMPStats();
  const { data: dashboard } = useGovRAMPDashboard();
  const uploadFeedback = useUploadGovRAMPFeedback();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const displayName = user
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : "there";

  const hasData = stats && (stats.total_controls > 0 || stats.controls_assessed > 0);
  const snapshots = dashboard?.snapshots || [];

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploadMsg(null);
    try {
      const res = await uploadFeedback.mutateAsync(selectedFile);
      setUploadMsg(`Imported ${res.imported} feedback rows. You're all set!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadMsg(`Error: ${err instanceof Error ? err.message : "Upload failed"}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl border bg-gradient-to-br from-navy via-[#003d8f] to-navy p-10 text-white shadow-elevated">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Hexagon className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-white/50 font-medium">Welcome to</p>
            <h1 className="text-2xl font-bold tracking-tight">Project Atelier</h1>
          </div>
        </div>
        <p className="text-xl font-semibold tracking-tight mt-2">
          Hey {displayName}!
        </p>
        <p className="mt-3 text-[15px] text-white/75 max-w-2xl leading-relaxed">
          Project Atelier is an AI-powered tool that helps companies prove they meet government security standards by automatically organizing evidence and writing the required compliance reports.
        </p>
      </div>

      {/* Onboarding CTA — shown when no data exists */}
      {!hasData && !statsLoading && (
        <Card className="border-2 border-dashed border-navy/20 bg-gradient-to-br from-sky-50/50 via-white to-indigo-50/50">
          <CardContent className="p-8">
            <div className="text-center max-w-xl mx-auto mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/8 mb-4">
                <Rocket className="h-7 w-7 text-navy" />
              </div>
              <h2 className="text-xl font-bold text-navy tracking-tight">Get Started with Project Atelier</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Upload your GovRAMP progress to begin. Choose how you&apos;d like to get started:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {/* Option 1 — Manual */}
              <div className="rounded-xl border bg-white p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <Upload className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-navy">Option 1 — Manual Entry</p>
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Manually enter your GovRAMP tier progress and missing controls one at a time through the GovRAMP Journey page.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => router.push("/govramp")}
                >
                  Go to GovRAMP Journey <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {/* Option 2 — CSV Upload (recommended) */}
              <div className="rounded-xl border-2 border-navy/15 bg-white p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-cta text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  Recommended
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <Zap className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-navy">Option 2 — Upload PMO Feedback CSV</p>
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Upload the GovRAMP PMO feedback CSV — you know, the one where the auditors assess you and nitpick everything.
                  Yeah, it&apos;s annoying... but that&apos;s exactly why Project Atelier exists. This is the <span className="font-semibold text-foreground">fastest, most streamlined</span> way to get started.
                </p>
                <div className="space-y-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      setSelectedFile(e.target.files?.[0] ?? null);
                      setUploadMsg(null);
                    }}
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    variant="cta"
                    className="w-full text-xs"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadFeedback.isPending}
                  >
                    {uploadFeedback.isPending ? (
                      <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading...</>
                    ) : (
                      <><FileSpreadsheet className="h-3 w-3 mr-1" /> Upload &amp; Import</>
                    )}
                  </Button>
                  {uploadMsg && (
                    <p className={`text-[11px] ${uploadMsg.startsWith("Error") ? "text-red-600" : "text-emerald-600"}`}>
                      {uploadMsg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Acceptance Rate — Time Plot */}
      {snapshots.length > 0 && (
        <Card className="hover:shadow-card-hover">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-section-title text-navy">Evidence Acceptance Rate</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Tracking evidence submission progress over time</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const sorted = [...snapshots].sort((a, b) => a.period.localeCompare(b.period));

              const series = [
                {
                  label: "Progressing Snapshot",
                  color: "#3b82f6",
                  data: sorted.map((s) => {
                    const total = s.core_required || 60;
                    const pct = s.snapshot_score ?? 0;
                    return Math.round((pct / 100) * total);
                  }),
                },
                { label: "Core", color: "#f97316", data: sorted.map((s) => s.core_implemented) },
                { label: "Ready", color: "#eab308", data: sorted.map((s) => s.ready_implemented) },
                { label: "Authorized", color: "#22c55e", data: sorted.map((s) => s.authorized_implemented) },
              ];

              const allValues = series.flatMap((s) => s.data);
              const maxVal = Math.max(...allValues, 1);
              const yMax = Math.ceil(maxVal / 10) * 10 || 10;

              const chartW = 700;
              const chartH = 280;
              const padL = 50;
              const padR = 20;
              const padT = 20;
              const padB = 45;
              const plotW = chartW - padL - padR;
              const plotH = chartH - padT - padB;

              const xStep = sorted.length > 1 ? plotW / (sorted.length - 1) : plotW;
              const toX = (i: number) => padL + (sorted.length > 1 ? i * xStep : plotW / 2);
              const toY = (v: number) => padT + plotH - (v / yMax) * plotH;

              const yTicks = 5;
              const yLines = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((yMax / yTicks) * i));

              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    {series.map((s) => (
                      <div key={s.label} className="flex items-center gap-1.5 text-xs">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="font-medium">{s.label}</span>
                      </div>
                    ))}
                  </div>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ maxHeight: 320 }}>
                    {yLines.map((v) => (
                      <g key={v}>
                        <line x1={padL} y1={toY(v)} x2={chartW - padR} y2={toY(v)} stroke="#e5e7eb" strokeWidth={1} />
                        <text x={padL - 8} y={toY(v) + 4} textAnchor="end" className="fill-muted-foreground" fontSize={11}>{v}</text>
                      </g>
                    ))}
                    {sorted.map((s, i) => {
                      const p = s.period;
                      const label = p.length === 6 ? `${p.slice(0, 4)}-${p.slice(4)}` : p;
                      return (
                        <text key={s.id} x={toX(i)} y={chartH - 8} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
                          {label}
                        </text>
                      );
                    })}
                    {series.map((s) => {
                      const points = s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
                      return (
                        <g key={s.label}>
                          <polyline points={points} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                          {s.data.map((v, i) => (
                            <circle key={i} cx={toX(i)} cy={toY(v)} r={4} fill="white" stroke={s.color} strokeWidth={2} />
                          ))}
                          {s.data.length > 0 && (
                            <text x={toX(s.data.length - 1) + 8} y={toY(s.data[s.data.length - 1]) + 4} fontSize={11} fontWeight="bold" fill={s.color}>
                              {s.data[s.data.length - 1]}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#94a3b8" strokeWidth={1} />
                    <line x1={padL} y1={padT + plotH} x2={chartW - padR} y2={padT + plotH} stroke="#94a3b8" strokeWidth={1} />
                  </svg>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* GovRAMP Tier Donut Charts */}
      <Card className="hover:shadow-card-hover">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/8">
                <Rocket className="h-4 w-4 text-navy" />
              </div>
              <div>
                <CardTitle className="text-section-title text-navy">GovRAMP Progress</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Progress across all four assessment tiers</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push("/govramp")} className="text-xs">
              View Details <ArrowRight className="h-3 w-3 ml-1.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <Skeleton className="h-[110px] w-[110px] rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {TIER_ORDER.map((tierKey) => {
                const tier = stats?.tiers?.[tierKey];
                if (!tier) return null;
                const pct = tier.pct || 0;
                const ringColor = TIER_RING_COLORS[tierKey] || "#6b7280";
                return (
                  <div key={tierKey} className="flex flex-col items-center text-center group">
                    <div className="relative">
                      <DonutChart pct={pct} color={ringColor} size={110} strokeWidth={9} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-navy tracking-tight">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[13px] font-semibold text-navy">{TIER_LABELS[tierKey]}</p>
                    <p className="text-xs text-muted-foreground">{tier.completed}/{tier.total} controls</p>
                    {tier.missing.length > 0 && (
                      <span className="mt-1 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 border border-orange-100">
                        {tier.missing.length} missing
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
