"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield } from "lucide-react";
import { useControls, useGovRAMPFeedback } from "@/hooks/use-api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonTable } from "@/components/layout/skeleton";

const FILTER_OPTIONS = [
  { key: "all", label: "All", dot: "bg-navy" },
  { key: "govramp", label: "Assessed", dot: "bg-navy" },
  { key: "pass", label: "Pass", dot: "bg-emerald-500" },
  { key: "concerns", label: "Concerns", dot: "bg-amber-500" },
  { key: "fail", label: "Fail", dot: "bg-red-500" },
  { key: "not_started", label: "Not Started", dot: "bg-slate-400" },
] as const;

type FilterKey = (typeof FILTER_OPTIONS)[number]["key"];

export default function ControlsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const { data: controls, isLoading } = useControls(search);
  const { data: feedback } = useGovRAMPFeedback();
  const router = useRouter();

  const pmoLookup = useMemo(() => {
    const map = new Map<
      string,
      { score: number | null; status: string; controlIds: string[] }
    >();
    if (!feedback) return map;

    for (const fb of feedback) {
      const raw = fb.control_id.replace(/\s*\(.*\)$/, "");
      const match = raw.match(/^([A-Z]{2})-(\d+)$/);
      const baseId = match ? `${match[1]}-${match[2].padStart(2, "0")}` : raw;

      const existing = map.get(baseId);
      const fbStatus = (fb.latest_status || (fb.control_completed ? "Pass" : "Fail")).toLowerCase();

      if (existing) {
        existing.controlIds.push(fb.control_id);
        const priority = ["fail", "pass with concerns", "pass", "not assessed"];
        const existingPri = priority.indexOf(existing.status);
        const newPri = priority.indexOf(fbStatus);
        if (newPri >= 0 && (existingPri < 0 || newPri < existingPri)) {
          existing.status = fbStatus;
        }
        if (fb.score != null) {
          existing.score =
            existing.score != null ? Math.min(existing.score, fb.score) : fb.score;
        }
      } else {
        map.set(baseId, {
          score: fb.score,
          status: fbStatus,
          controlIds: [fb.control_id],
        });
      }
    }
    return map;
  }, [feedback]);

  const filteredControls = useMemo(() => {
    if (!controls) return [];
    if (activeFilter === "all") return controls;

    return controls.filter((c) => {
      const pmo = pmoLookup.get(c.control_id);

      switch (activeFilter) {
        case "govramp":
          return !!pmo;
        case "pass":
          return pmo?.status === "pass";
        case "concerns":
          return pmo?.status === "pass with concerns";
        case "fail":
          return pmo?.status === "fail";
        case "not_started":
          return !pmo;
        default:
          return true;
      }
    });
  }, [controls, activeFilter, pmoLookup]);

  const filterCounts = useMemo(() => {
    if (!controls) return {} as Record<FilterKey, number>;
    const counts: Record<string, number> = {
      all: controls.length,
      govramp: 0,
      pass: 0,
      concerns: 0,
      fail: 0,
      not_started: 0,
    };
    for (const c of controls) {
      const pmo = pmoLookup.get(c.control_id);
      if (!pmo) {
        counts.not_started++;
        continue;
      }
      counts.govramp++;
      if (pmo.status === "pass") counts.pass++;
      else if (pmo.status === "pass with concerns") counts.concerns++;
      else if (pmo.status === "fail") counts.fail++;
    }
    return counts as Record<FilterKey, number>;
  }, [controls, pmoLookup]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700";
    if (score >= 50) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  };

  const getPmoStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pass with concerns":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "fail":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        title="NIST 800-53 Controls"
        description={`${filteredControls.length} of ${controls?.length ?? 0} controls`}
      />

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setActiveFilter(opt.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-150 border ${
                activeFilter === opt.key
                  ? "bg-navy text-white border-navy shadow-sm"
                  : "bg-white text-muted-foreground border-border hover:border-navy/20 hover:text-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${activeFilter === opt.key ? "bg-white" : opt.dot}`} />
              {opt.label}
              <span className={`ml-0.5 text-[10px] tabular-nums ${activeFilter === opt.key ? "text-white/70" : "text-muted-foreground"}`}>
                {filterCounts[opt.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search controls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-[13px]"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : (
        <div className="rounded-xl border bg-card shadow-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Control</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Family</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PMO Status</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Evidence</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {filteredControls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    {activeFilter === "all"
                      ? "No controls found. Run the seed script first."
                      : "No controls match this filter."}
                  </td>
                </tr>
              ) : (
                filteredControls.map((c) => {
                  const pmo = pmoLookup.get(c.control_id);
                  return (
                    <tr
                      key={c.control_id}
                      onClick={() => router.push(`/controls/${c.control_id}`)}
                      className="border-b last:border-0 cursor-pointer hover:bg-navy/[0.02] transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-navy group-hover:text-navy/80">
                          {c.control_id}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.family}</td>
                      <td className="px-4 py-3 text-foreground">{c.title}</td>
                      <td className="px-4 py-3 text-center">
                        {pmo ? (
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${getPmoStatusBadge(pmo.status)}`}
                          >
                            {pmo.status === "pass with concerns"
                              ? "Concerns"
                              : pmo.status.charAt(0).toUpperCase() + pmo.status.slice(1)}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pmo?.score != null ? (
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${getScoreBg(pmo.score)}`}>
                            {pmo.score.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="tabular-nums text-muted-foreground">{c.evidence_count}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.latest_confidence_score != null ? (
                          <span
                            className={`font-bold tabular-nums ${getScoreColor(c.latest_confidence_score)}`}
                          >
                            {c.latest_confidence_score}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
