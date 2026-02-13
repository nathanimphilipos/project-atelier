export interface Control {
  control_id: string;
  family: string;
  title: string;
  control_text: string;
  discussion?: string;
  enhancements?: string;
  status: string;
  updated_at?: string;
  evidence_count: number;
  latest_confidence_score?: number | null;
}

export interface Evidence {
  id: number;
  filename: string;
  filepath: string;
  filetype: string;
  uploaded_at?: string;
  extracted_text?: string;
  vision_summary_json?: Record<string, unknown>;
  source_system?: string;
  owner?: string;
  tags?: string[];
  sha256_hash: string;
  linked_controls: string[];
  linked_soc2_targets: string[];
}

export interface Feedback {
  id: number;
  control_id: string;
  filename?: string;
  extracted_text: string;
  findings_json?: {
    findings: string[];
    missing_proof_requests: string[];
    required_wording: string[];
    rejected_claims: string[];
    remediation_requests: string[];
  };
  created_at?: string;
}

export interface Narrative {
  id: number;
  control_id: string;
  version: number;
  narrative_text: string;
  scoring_inputs_json?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  model_used?: string;
  prompt_version?: string;
  inputs_json?: Record<string, unknown>;
}

export interface Assessment {
  id: number;
  control_id: string;
  meets_status: string;
  confidence_score: number;
  score_rationale_json?: {
    why_this_score: string[];
    top_3_actions_to_raise_score: string[];
  };
  created_at?: string;
  model_used?: string;
  prompt_version?: string;
}

export interface Board {
  id: number;
  name: string;
  created_at?: string;
  card_count: number;
}

export interface Card {
  id: number;
  board_id: number;
  column: string;
  title: string;
  description?: string;
  owner?: string;
  due_date?: string;
  linked_control_ids?: string[];
  linked_evidence_ids?: number[];
  linked_narrative_id?: number;
  source_row_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SOC2Target {
  soc2_target: string;
  evidence_objective?: string;
  nist_control_ids: string[];
  linked_evidence_count: number;
  satisfied: boolean;
}

export interface GenerateResult {
  narrative: Narrative;
  assessment: Assessment;
}

export interface GovRAMPSnapshot {
  id: number;
  period: string;
  snapshot_score: number | null;
  core_implemented: number;
  core_required: number;
  ready_implemented: number;
  ready_required: number;
  authorized_implemented: number;
  authorized_required: number;
}

export interface GovRAMPProgress {
  id: number;
  tier: string;
  total_controls: number;
  completed_controls: number;
  completion_pct: number;
  missing_control_ids: string[] | null;
}

export interface GovRAMPDashboard {
  tiers: GovRAMPProgress[];
  snapshots: GovRAMPSnapshot[];
}

export interface GovRAMPFeedback {
  id: number;
  control_id: string;
  control_name: string | null;
  family: string | null;
  control_completed: boolean;
  score: number | null;
  month_last_passed: string | null;
  latest_period: string | null;
  latest_status: string | null;
  latest_feedback: string | null;
  issues: string[] | null;
  feedback_history: Record<string, string> | null;
}

export interface GovRAMPFeedbackSummary {
  total: number;
  status_counts: Record<string, number>;
}

export interface GovRAMPFeedbackUploadResult {
  imported: number;
  latest_period: string | null;
}

export interface GovRAMPStats {
  total_controls: number;
  controls_assessed: number;
  avg_confidence: number | null;
  tiers: Record<string, {
    total: number;
    completed: number;
    pct: number;
    missing: string[];
  }>;
  latest_snapshot_score: number | null;
  latest_snapshot_period: string | null;
  feedback_summary?: GovRAMPFeedbackSummary | null;
}

export const TIER_LABELS: Record<string, string> = {
  ps: "Progressing Snapshot",
  ready: "GovRAMP Ready",
  core: "GovRAMP Core",
  authorized: "GovRAMP Authorized",
};

export const TIER_CONTROLS: Record<string, number> = {
  ps: 40,
  ready: 80,
  core: 60,
  authorized: 319,
};

export const TIER_COLORS: Record<string, string> = {
  ps: "bg-blue-500",
  ready: "bg-yellow-500",
  core: "bg-orange-500",
  authorized: "bg-green-500",
};

export const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  draft: "Draft",
  needs_evidence: "Needs Evidence",
  under_review: "Under Review",
  ready: "Ready",
};

export const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-200 text-gray-700",
  draft: "bg-yellow-100 text-yellow-800",
  needs_evidence: "bg-orange-100 text-orange-800",
  under_review: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
};

export const COLUMN_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Ready for Review",
  done: "Done",
};

export const COLUMN_COLORS: Record<string, string> = {
  todo: "bg-gray-100",
  in_progress: "bg-blue-50",
  blocked: "bg-red-50",
  review: "bg-yellow-50",
  done: "bg-green-50",
};
