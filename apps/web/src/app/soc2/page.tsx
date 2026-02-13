"use client";

import { CheckCircle2, XCircle, Link2, RefreshCw } from "lucide-react";
import { useSOC2Targets, useEvidence } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { EmptyState } from "@/components/layout/empty-state";
import { SkeletonTable } from "@/components/layout/skeleton";

export default function SOC2ReusePage() {
  const { data: targets, isLoading } = useSOC2Targets();
  const { data: allEvidence } = useEvidence();

  const satisfied = targets?.filter((t) => t.satisfied) || [];
  const unsatisfied = targets?.filter((t) => !t.satisfied) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RefreshCw}
        title="SOC 2 Evidence Reuse"
        description="Reuse NIST 800-53 evidence for SOC 2 targets via crosswalk mapping"
      />

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : !targets || targets.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No SOC 2 crosswalk data imported"
          description="Go to Imports to upload a crosswalk CSV to see evidence reuse opportunities."
        />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={Link2}
              label="Total Targets"
              value={targets.length}
              iconBg="bg-navy/8"
              iconColor="text-navy"
              valueColor="text-navy"
            />
            <StatCard
              icon={CheckCircle2}
              label="Satisfied"
              value={satisfied.length}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              valueColor="text-emerald-600"
            />
            <StatCard
              icon={XCircle}
              label="Unsatisfied"
              value={unsatisfied.length}
              iconBg="bg-red-50"
              iconColor="text-red-500"
              valueColor="text-red-600"
            />
          </div>

          {/* Target List */}
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-navy">
                    SOC 2 Target
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-navy">
                    Evidence Objective
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-navy">
                    NIST Controls
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-navy">
                    Evidence
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-navy">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t) => (
                  <tr key={t.soc2_target} className="border-b">
                    <td className="px-4 py-3 font-mono font-semibold">
                      {t.soc2_target}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {t.evidence_objective || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.nist_control_ids.map((cid) => (
                          <Badge
                            key={cid}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {cid}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.linked_evidence_count}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.satisfied ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reusable Evidence Suggestions */}
          {allEvidence && allEvidence.length > 0 && unsatisfied.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Reusable Evidence Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Evidence linked to NIST controls that map to unsatisfied SOC 2
                  targets:
                </p>
                <div className="space-y-2">
                  {unsatisfied.slice(0, 5).map((t) => {
                    const relatedEvidence = allEvidence.filter((ev) =>
                      ev.linked_controls.some((cid) =>
                        t.nist_control_ids.includes(cid)
                      )
                    );
                    if (relatedEvidence.length === 0) return null;
                    return (
                      <div
                        key={t.soc2_target}
                        className="p-3 border rounded text-sm"
                      >
                        <p className="font-medium">
                          {t.soc2_target}
                        </p>
                        <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
                          {relatedEvidence.map((ev) => (
                            <li key={ev.id}>
                              {ev.filename} (linked to{" "}
                              {ev.linked_controls.join(", ")})
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
