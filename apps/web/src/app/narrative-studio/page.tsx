"use client";

import { useRouter } from "next/navigation";
import { PenTool, ArrowRight, FileText, Archive } from "lucide-react";
import { useControls } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { SkeletonCard } from "@/components/layout/skeleton";

export default function NarrativeStudioPage() {
  const router = useRouter();
  const { data: controls, isLoading } = useControls();

  const controlsWithNarratives =
    controls?.filter(
      (c) => c.status !== "not_started"
    ) || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700";
    if (score >= 50) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PenTool}
        title="Narrative Studio"
        description="Quick access to controls with active narratives"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : controlsWithNarratives.length === 0 ? (
        <EmptyState
          icon={PenTool}
          title="No narratives generated yet"
          description="Go to Controls and generate a narrative for any control to see it here."
          action={
            <Button size="sm" variant="outline" onClick={() => router.push("/controls")}>
              Browse Controls <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {controlsWithNarratives.map((c) => (
            <Card
              key={c.control_id}
              className="cursor-pointer group hover:shadow-card-hover"
              onClick={() => router.push(`/controls/${c.control_id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/6 group-hover:bg-navy/10 transition-colors">
                      <FileText className="h-4 w-4 text-navy" />
                    </div>
                    <div>
                      <p className="font-mono text-[13px] font-bold text-navy">
                        {c.control_id}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">{c.title}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-navy transition-colors shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Archive className="h-3 w-3" />
                    {c.evidence_count} evidence
                  </span>
                  {c.latest_confidence_score != null && (
                    <span
                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${getScoreColor(c.latest_confidence_score)}`}
                    >
                      {c.latest_confidence_score}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
