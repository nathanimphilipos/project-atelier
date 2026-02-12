"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield } from "lucide-react";
import { useControls } from "@/hooks/use-api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/types";

export default function ControlsPage() {
  const [search, setSearch] = useState("");
  const { data: controls, isLoading } = useControls(search);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">NIST 800-53 Controls</h1>
          <p className="text-sm text-muted-foreground">
            {controls?.length ?? 0} controls loaded
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search controls by ID, family, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-navy">Control ID</th>
              <th className="px-4 py-3 text-left font-medium text-navy">Family</th>
              <th className="px-4 py-3 text-left font-medium text-navy">Title</th>
              <th className="px-4 py-3 text-center font-medium text-navy">Status</th>
              <th className="px-4 py-3 text-center font-medium text-navy">Evidence</th>
              <th className="px-4 py-3 text-center font-medium text-navy">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading controls...
                </td>
              </tr>
            ) : controls?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No controls found. Run the seed script first.
                </td>
              </tr>
            ) : (
              controls?.map((c) => (
                <tr
                  key={c.control_id}
                  onClick={() => router.push(`/controls/${c.control_id}`)}
                  className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-navy">
                    {c.control_id}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.family}</td>
                  <td className="px-4 py-3">{c.title}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      className={STATUS_COLORS[c.status] || STATUS_COLORS.not_started}
                    >
                      {STATUS_LABELS[c.status] || c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-muted-foreground">{c.evidence_count}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.latest_confidence_score != null ? (
                      <span
                        className={`font-bold ${
                          c.latest_confidence_score >= 80
                            ? "text-green-600"
                            : c.latest_confidence_score >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {c.latest_confidence_score}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
