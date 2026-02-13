"use client";

import { useRouter } from "next/navigation";
import {
  Shield,
  Rocket,
  Archive,
  PenTool,
  LayoutDashboard,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useGovRAMPStats, useControls } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TIER_LABELS } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Skeleton } from "@/components/layout/skeleton";
import { Home } from "lucide-react";

const TIER_ORDER = ["ps", "ready", "core", "authorized"];

const TIER_RING_COLORS: Record<string, string> = {
  ps: "#3b82f6",
  ready: "#eab308",
  core: "#f97316",
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
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
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

const STATUS_ROWS = [
  { key: "ready", label: "Ready", color: "bg-emerald-500" },
  { key: "draft", label: "Draft", color: "bg-amber-400" },
  { key: "needs_evidence", label: "Needs Evidence", color: "bg-orange-500" },
  { key: "not_started", label: "Not Started", color: "bg-slate-300" },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useGovRAMPStats();
  const { data: controls } = useControls();

  const statusCounts: Record<string, number> = {
    ready: controls?.filter((c) => c.status === "ready").length ?? 0,
    draft: controls?.filter((c) => c.status === "draft").length ?? 0,
    needs_evidence: controls?.filter((c) => c.status === "needs_evidence").length ?? 0,
    not_started: 0,
  };
  statusCounts.not_started =
    (controls?.length ?? 0) - statusCounts.ready - statusCounts.draft - statusCounts.needs_evidence;
  const totalControls = controls?.length ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Home}
        title="Dashboard"
        description="Control-first NIST 800-53 Rev 5 narrative generation platform"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Shield}
          label="Total Controls"
          value={stats?.total_controls ?? "—"}
          iconBg="bg-navy/8"
          iconColor="text-navy"
          valueColor="text-navy"
        />
        <StatCard
          icon={PenTool}
          label="Narratives Generated"
          value={stats?.controls_assessed ?? 0}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          valueColor="text-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Confidence"
          value={stats?.avg_confidence != null ? stats.avg_confidence.toFixed(0) : "—"}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          valueColor="text-blue-600"
        />
        <StatCard
          icon={Rocket}
          label="GovRAMP Snapshot"
          value={stats?.latest_snapshot_score != null ? `${stats.latest_snapshot_score.toFixed(1)}%` : "—"}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          valueColor="text-amber-600"
        />
      </div>

      {/* GovRAMP Journey Progress — Donut Charts */}
      <Card className="hover:shadow-card-hover">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/8">
                <Rocket className="h-4 w-4 text-navy" />
              </div>
              <div>
                <CardTitle className="text-section-title text-navy">
                  GovRAMP Journey
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Progress across all tiers</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/govramp")}
              className="text-xs"
            >
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
                  <div
                    key={tierKey}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="relative">
                      <DonutChart pct={pct} color={ringColor} size={110} strokeWidth={9} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-navy tracking-tight">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[13px] font-semibold text-navy">
                      {TIER_LABELS[tierKey]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tier.completed}/{tier.total} controls
                    </p>
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Control Status Breakdown */}
        <Card className="lg:col-span-2 hover:shadow-card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-title text-navy">Control Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STATUS_ROWS.map(({ key, label, color }) => {
                const count = statusCounts[key] ?? 0;
                const pct = totalControls > 0 ? (count / totalControls) * 100 : 0;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="lg:col-span-3 hover:shadow-card-hover">
          <CardHeader className="pb-4">
            <CardTitle className="text-section-title text-navy">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { icon: Shield, label: "Browse Controls", href: "/controls", desc: "View all NIST 800-53 controls" },
                { icon: Archive, label: "Evidence Vault", href: "/evidence", desc: "Upload and manage evidence" },
                { icon: LayoutDashboard, label: "Project Boards", href: "/boards", desc: "Kanban task tracking" },
                { icon: Rocket, label: "GovRAMP Journey", href: "/govramp", desc: "Track tier progress" },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition-all duration-150 hover:shadow-card-hover hover:border-navy/15 group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/6 group-hover:bg-navy/10 transition-colors">
                    <item.icon className="h-4 w-4 text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-navy">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-navy transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
