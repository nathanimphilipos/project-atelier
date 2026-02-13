"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ListTodo,
  Link2,
} from "lucide-react";
import {
  useControl,
  useEvidence,
  useFeedback,
  useNarratives,
  useAssessments,
  useUploadEvidence,
  useLinkEvidence,
  useCreateFeedback,
  useGenerateNarrative,
  useCreateCardsFromGaps,
} from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/types";

export default function ControlWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const controlId = params.controlId as string;

  const { data: control } = useControl(controlId);
  const { data: evidence, refetch: refetchEvidence } = useEvidence(controlId);
  const { data: feedbackList } = useFeedback(controlId);
  const { data: narratives } = useNarratives(controlId);
  const { data: assessments } = useAssessments(controlId);

  const uploadEvidence = useUploadEvidence();
  const linkEvidence = useLinkEvidence();
  const createFeedback = useCreateFeedback();
  const generateNarrative = useGenerateNarrative();
  const createCards = useCreateCardsFromGaps();

  const [currentNarrative, setCurrentNarrative] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackFileRef = useRef<HTMLInputElement>(null);

  const latestNarrative = narratives?.[0];
  const latestAssessment = assessments?.[0];

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      for (const file of Array.from(files)) {
        const ev = await uploadEvidence.mutateAsync(file);
        await linkEvidence.mutateAsync({
          controlId,
          evidenceIds: [ev.id],
        });
      }
      refetchEvidence();
    },
    [controlId, uploadEvidence, linkEvidence, refetchEvidence]
  );

  const handleFeedbackSubmit = useCallback(async () => {
    if (!feedbackText.trim()) return;
    await createFeedback.mutateAsync({ controlId, text: feedbackText });
    setFeedbackText("");
  }, [controlId, feedbackText, createFeedback]);

  const handleFeedbackFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await createFeedback.mutateAsync({ controlId, file });
    },
    [controlId, createFeedback]
  );

  const handleGenerate = useCallback(async () => {
    const evidenceIds = evidence?.map((e) => e.id) || [];
    const latestFeedback = feedbackList?.[0];
    await generateNarrative.mutateAsync({
      control_id: controlId,
      evidence_ids: evidenceIds,
      narrative_text: currentNarrative || undefined,
      feedback_id: latestFeedback?.id,
    });
  }, [controlId, evidence, feedbackList, currentNarrative, generateNarrative]);

  const handleCopy = useCallback(() => {
    if (latestNarrative) {
      navigator.clipboard.writeText(latestNarrative.narrative_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [latestNarrative]);

  const handleCreateCards = useCallback(async () => {
    await createCards.mutateAsync({ controlId, boardId: 1 });
  }, [controlId, createCards]);

  if (!control) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading control...
      </div>
    );
  }

  const meetsIcon =
    latestAssessment?.meets_status === "meets" ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : latestAssessment?.meets_status === "partially_meets" ? (
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
    ) : latestAssessment?.meets_status === "not_met" ? (
      <XCircle className="h-5 w-5 text-red-600" />
    ) : null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-navy">
          {control.control_id}: {control.title}
        </h1>
        <Badge className={STATUS_COLORS[control.status] || STATUS_COLORS.not_started}>
          {STATUS_LABELS[control.status] || control.status}
        </Badge>
      </div>

      {/* Control Statement */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Control Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{control.control_text}</p>
          {control.discussion && (
            <div className="mt-2 p-3 bg-muted rounded text-xs">
              <strong>Discussion:</strong> {control.discussion}
            </div>
          )}
          {control.enhancements && (
            <div className="mt-1 p-3 bg-muted rounded text-xs">
              <strong>Enhancements:</strong> {control.enhancements}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Evidence + Feedback */}
        <div className="space-y-6">
          {/* Evidence Upload */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Evidence</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadEvidence.isPending}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {uploadEvidence.isPending ? "Uploading..." : "Upload"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </CardHeader>
            <CardContent>
              {evidence?.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No evidence uploaded yet. Upload PNG, JPG, PDF, or DOCX files.
                </p>
              ) : (
                <div className="space-y-2">
                  {evidence?.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 p-2 rounded border text-sm"
                    >
                      <FileText className="h-4 w-4 text-navy shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ev.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {ev.filetype} &middot;{" "}
                          {ev.extracted_text
                            ? `${ev.extracted_text.slice(0, 80)}...`
                            : "Processing..."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Narrative */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Current Narrative (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your current narrative text here (optional)..."
                value={currentNarrative}
                onChange={(e) => setCurrentNarrative(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Auditor Feedback */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Auditor Feedback</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => feedbackFileRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" /> Upload
                </Button>
                <input
                  ref={feedbackFileRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFeedbackFile}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Paste auditor/PMO feedback here..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
              />
              <Button
                size="sm"
                onClick={handleFeedbackSubmit}
                disabled={!feedbackText.trim() || createFeedback.isPending}
              >
                Submit Feedback
              </Button>
              {feedbackList && feedbackList.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Previous feedback:
                  </p>
                  {feedbackList.map((fb) => (
                    <div key={fb.id} className="p-2 border rounded text-xs">
                      <p className="font-medium">{fb.filename || "Pasted text"}</p>
                      {fb.findings_json && (
                        <ul className="mt-1 list-disc list-inside text-muted-foreground">
                          {fb.findings_json.findings?.slice(0, 3).map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Generate + Output */}
        <div className="space-y-6">
          {/* Generate Button */}
          <Card className="border-cta/30">
            <CardContent className="pt-6">
              <Button
                variant="cta"
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={generateNarrative.isPending}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {generateNarrative.isPending
                  ? "Generating..."
                  : "Generate Updated Narrative"}
              </Button>
              {generateNarrative.isError && (
                <p className="mt-2 text-sm text-destructive">
                  {(generateNarrative.error as Error).message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Confidence Score */}
          {latestAssessment && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {meetsIcon}
                  <CardTitle className="text-base">Assessment</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div
                    className={`text-4xl font-bold ${
                      latestAssessment.confidence_score >= 80
                        ? "text-green-600"
                        : latestAssessment.confidence_score >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {latestAssessment.confidence_score}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">
                      {latestAssessment.meets_status.replace("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Confidence Score
                    </p>
                  </div>
                </div>
                {latestAssessment.score_rationale_json && (
                  <>
                    <div>
                      <p className="text-xs font-medium mb-1">Why this score:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {latestAssessment.score_rationale_json.why_this_score?.map(
                          (r, i) => <li key={i}>{r}</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">
                        Top actions to raise score:
                      </p>
                      <ul className="text-xs list-disc list-inside text-cta">
                        {latestAssessment.score_rationale_json.top_3_actions_to_raise_score?.map(
                          (a, i) => <li key={i}>{a}</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Copy-Paste Narrative */}
          {latestNarrative && (() => {
            const raw = latestNarrative.narrative_text || "";
            const startTag = "===COPY-PASTE NARRATIVE START===";
            const endTag = "===COPY-PASTE NARRATIVE END===";
            const startIdx = raw.indexOf(startTag);
            const endIdx = raw.indexOf(endTag);
            const cleanNarrative =
              startIdx !== -1 && endIdx !== -1
                ? raw.slice(startIdx + startTag.length, endIdx).trim()
                : null;
            const assessmentDetails =
              endIdx !== -1
                ? raw.slice(endIdx + endTag.length).trim()
                : raw;

            return (
              <>
                {/* Clean narrative for copy-paste */}
                {cleanNarrative && (
                  <Card className="border-green-200 bg-green-50/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Control Narrative (v{latestNarrative.version})
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(cleanNarrative);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          {copied ? "Copied!" : "Copy Narrative"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ready to paste into your SSP or StateRAMP Security Snapshot
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white border rounded-lg p-5 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                        {cleanNarrative}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Full assessment details (collapsible) */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        PMO Assessment Details
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded max-h-96 overflow-auto">
                      {assessmentDetails}
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}

          {/* Create Cards from Gaps */}
          {latestNarrative && (
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateCards}
                  disabled={createCards.isPending}
                >
                  <ListTodo className="h-4 w-4 mr-1" />
                  {createCards.isPending
                    ? "Creating..."
                    : "Create Tasks from Gaps"}
                </Button>
                {createCards.isSuccess && (
                  <span className="text-xs text-cta">
                    {createCards.data?.cards_created} cards created
                  </span>
                )}
              </CardContent>
            </Card>
          )}

          {/* SOC 2 Crosswalk Panel */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <CardTitle className="text-base">SOC 2 Reuse</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                SOC 2 targets linked to this control will appear here once a
                crosswalk is imported.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
