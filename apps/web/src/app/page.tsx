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
import { TIER_LABELS, TIER_COLORS } from "@/lib/types";

const TIER_ORDER = ["ps", "ready", "core", "authorized"];

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useGovRAMPStats();
  const { data: controls } = useControls();

  const readyCount =
    controls?.filter((c) => c.status === "ready").length ?? 0;
  const draftCount =
    controls?.filter((c) => c.status === "draft").length ?? 0;
  const needsEvidenceCount =
    controls?.filter((c) => c.status === "needs_evidence").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Project Atelier</h1>
        <p className="text-sm text-muted-foreground">
          Control-first NIST 800-53 Rev 5 narrative generation platform
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-navy/10 p-2">
                <Shield className="h-5 w-5 text-navy" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">
                  {stats?.total_controls ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">Total Controls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <PenTool className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.controls_assessed ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Narratives Generated
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.avg_confidence != null
                    ? stats.avg_confidence.toFixed(0)
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg Confidence Score
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Rocket className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.latest_snapshot_score != null
                    ? `${stats.latest_snapshot_score.toFixed(1)}%`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  GovRAMP Snapshot
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GovRAMP Journey Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="h-4 w-4 text-navy" />
              GovRAMP Journey Progress
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/govramp")}
              className="text-xs"
            >
              Manage <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              {TIER_ORDER.map((tierKey) => {
                const tier = stats?.tiers?.[tierKey];
                if (!tier) return null;
                const pct = tier.pct || 0;
                return (
                  <div key={tierKey}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {TIER_LABELS[tierKey]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {tier.completed}/{tier.total} controls ·{" "}
                        <span className="font-bold text-navy">
                          {pct.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${TIER_COLORS[tierKey]}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    {tier.missing.length > 0 && (
                      <p className="text-[10px] text-orange-600 mt-0.5">
                        Missing: {tier.missing.slice(0, 8).join(", ")}
                        {tier.missing.length > 8 &&
                          ` +${tier.missing.length - 8} more`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Status Breakdown + Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Control Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Ready</span>
                <span className="text-sm font-bold text-green-600">
                  {readyCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Draft</span>
                <span className="text-sm font-bold text-yellow-600">
                  {draftCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Needs Evidence</span>
                <span className="text-sm font-bold text-orange-600">
                  {needsEvidenceCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Not Started</span>
                <span className="text-sm font-bold text-gray-500">
                  {(controls?.length ?? 0) -
                    readyCount -
                    draftCount -
                    needsEvidenceCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => router.push("/controls")}
            >
              <Shield className="h-4 w-4 mr-2" />
              Browse Controls
              <ArrowRight className="h-3 w-3 ml-auto" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => router.push("/evidence")}
            >
              <Archive className="h-4 w-4 mr-2" />
              Evidence Vault
              <ArrowRight className="h-3 w-3 ml-auto" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => router.push("/boards")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Project Boards
              <ArrowRight className="h-3 w-3 ml-auto" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => router.push("/govramp")}
            >
              <Rocket className="h-4 w-4 mr-2" />
              GovRAMP Journey
              <ArrowRight className="h-3 w-3 ml-auto" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
