"use client";

import { useRouter } from "next/navigation";
import { PenTool, ArrowRight, FileText, Archive, Cloud, ShieldCheck, Lock, Server, Eye, Key, Users, Database, Activity, Globe } from "lucide-react";
import { useControls } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { SkeletonCard } from "@/components/layout/skeleton";

const AWS_EVIDENCE_SUGGESTIONS: Record<string, { evidence: string[]; icon: typeof Cloud }> = {
  "AC": {
    evidence: [
      "AWS IAM policy JSON exports",
      "AWS SSO / Identity Center config screenshots",
      "CloudTrail logs showing access events",
      "AWS Organizations SCP policies",
    ],
    icon: Users,
  },
  "AU": {
    evidence: [
      "CloudTrail trail configuration",
      "CloudWatch log group retention settings",
      "S3 bucket policy for log storage",
      "AWS Config rule evaluation results",
    ],
    icon: Eye,
  },
  "IA": {
    evidence: [
      "IAM password policy screenshot",
      "MFA enforcement policy (IAM or SSO)",
      "AWS Secrets Manager rotation config",
      "Certificate Manager (ACM) certificate list",
    ],
    icon: Key,
  },
  "SC": {
    evidence: [
      "VPC security group rules export",
      "AWS WAF web ACL configuration",
      "TLS/SSL certificate details from ACM",
      "Network ACL rules for subnets",
    ],
    icon: Lock,
  },
  "SI": {
    evidence: [
      "GuardDuty findings summary",
      "AWS Inspector vulnerability scan results",
      "Systems Manager patch compliance report",
      "CloudWatch alarm configurations",
    ],
    icon: ShieldCheck,
  },
  "CM": {
    evidence: [
      "AWS Config compliance dashboard screenshot",
      "CloudFormation / Terraform state files",
      "Systems Manager inventory report",
      "AMI baseline configuration docs",
    ],
    icon: Server,
  },
  "CP": {
    evidence: [
      "AWS Backup vault and plan configuration",
      "RDS automated backup settings",
      "S3 cross-region replication config",
      "Disaster recovery runbook (stored in S3/Confluence)",
    ],
    icon: Database,
  },
  "IR": {
    evidence: [
      "Incident response plan document",
      "GuardDuty + Security Hub integration config",
      "SNS notification topic for security alerts",
      "Post-incident review template",
    ],
    icon: Activity,
  },
  "RA": {
    evidence: [
      "AWS Inspector assessment run results",
      "Security Hub findings export",
      "Third-party penetration test report",
      "Risk register spreadsheet",
    ],
    icon: Globe,
  },
};

function getEvidenceForFamily(family: string) {
  const key = family.split("-")[0]?.toUpperCase();
  return AWS_EVIDENCE_SUGGESTIONS[key] || null;
}

export default function NarrativeStudioPage() {
  const router = useRouter();
  const { data: controls, isLoading } = useControls();

  const controlsWithNarratives =
    controls?.filter(
      (c) => c.status !== "not_started"
    ) || [];

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return "Very likely to pass";
    if (score >= 75) return "Likely to pass";
    if (score >= 50) return "May need more evidence";
    return "Unlikely to pass";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PenTool}
        title="Narrative Studio"
        description="Generate compliance narratives from your evidence — AI writes the story, you provide the proof"
      />

      {/* Cloud Provider Banner */}
      <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-[#FF9900]/5 via-white to-white p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF9900]/10">
          <Cloud className="h-5 w-5 text-[#FF9900]" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-navy">
            AWS-First Evidence Suggestions
          </p>
          <p className="text-[11px] text-muted-foreground">
            Each control shows recommended AWS artifacts to collect as evidence for your narrative.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20">
            AWS
          </Badge>
          <Badge variant="secondary" className="text-[10px] opacity-40">
            Azure — Coming Soon
          </Badge>
          <Badge variant="secondary" className="text-[10px] opacity-40">
            GCP — Coming Soon
          </Badge>
        </div>
      </div>

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
          description="Go to Controls, attach evidence, and generate a narrative. The AI will write a compliance narrative based on your evidence and give you a confidence score on whether the auditor will accept it."
          action={
            <Button size="sm" variant="outline" onClick={() => router.push("/controls")}>
              Browse Controls <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {controlsWithNarratives.map((c) => {
            const awsEvidence = getEvidenceForFamily(c.family);
            const IconComponent = awsEvidence?.icon || FileText;

            return (
              <Card
                key={c.control_id}
                className="cursor-pointer group hover:shadow-card-hover"
                onClick={() => router.push(`/controls/${c.control_id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/6 group-hover:bg-navy/10 transition-colors">
                        <IconComponent className="h-4 w-4 text-navy" />
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

                  {/* AWS Suggested Evidence */}
                  {awsEvidence && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-[10px] font-semibold text-[#FF9900] uppercase tracking-wide mb-1.5">
                        Suggested AWS Evidence
                      </p>
                      <div className="space-y-1">
                        {awsEvidence.evidence.slice(0, 2).map((ev) => (
                          <p key={ev} className="text-[11px] text-muted-foreground flex items-start gap-1">
                            <span className="text-[#FF9900] mt-0.5">•</span> {ev}
                          </p>
                        ))}
                        {awsEvidence.evidence.length > 2 && (
                          <p className="text-[10px] text-muted-foreground/60">
                            +{awsEvidence.evidence.length - 2} more suggestions
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer: evidence count + auditor confidence */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Archive className="h-3 w-3" />
                      {c.evidence_count} evidence
                    </span>
                    {c.latest_confidence_score != null && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${getConfidenceColor(c.latest_confidence_score)}`}
                        >
                          {c.latest_confidence_score}%
                        </span>
                        <span className="text-[9px] text-muted-foreground max-w-[80px] leading-tight">
                          {getConfidenceLabel(c.latest_confidence_score)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
