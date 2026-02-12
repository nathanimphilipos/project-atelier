"use client";

import { useRouter } from "next/navigation";
import { PenTool } from "lucide-react";
import { useControls } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";

export default function NarrativeStudioPage() {
  const router = useRouter();
  const { data: controls } = useControls();

  const controlsWithNarratives =
    controls?.filter(
      (c) => c.status !== "not_started"
    ) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Narrative Studio</h1>
        <p className="text-sm text-muted-foreground">
          Quick access to controls with active narratives. Select a control to
          open its workspace.
        </p>
      </div>

      {controlsWithNarratives.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <PenTool className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No narratives generated yet.</p>
            <p className="text-xs mt-1">
              Go to Controls and generate a narrative for any control to see it
              here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {controlsWithNarratives.map((c) => (
            <Card
              key={c.control_id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/controls/${c.control_id}`)}
            >
              <CardContent className="pt-6">
                <p className="font-mono font-bold text-navy">
                  {c.control_id}
                </p>
                <p className="text-sm mt-1">{c.title}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-muted-foreground">
                    {c.evidence_count} evidence
                  </span>
                  {c.latest_confidence_score != null && (
                    <span
                      className={`text-xs font-bold ${
                        c.latest_confidence_score >= 80
                          ? "text-green-600"
                          : c.latest_confidence_score >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      Score: {c.latest_confidence_score}
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
