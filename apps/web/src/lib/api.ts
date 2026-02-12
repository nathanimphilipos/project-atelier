const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function upload<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload error ${res.status}: ${text}`);
  }
  return res.json();
}

import type {
  Control,
  Evidence,
  Feedback,
  Narrative,
  Assessment,
  Board,
  Card,
  SOC2Target,
  GenerateResult,
  GovRAMPDashboard,
  GovRAMPProgress,
  GovRAMPStats,
  GovRAMPFeedback,
  GovRAMPFeedbackUploadResult,
} from "./types";

export const api = {
  controls: {
    list: (search = "") =>
      request<Control[]>(`/controls?search=${encodeURIComponent(search)}`),
    get: (id: string) => request<Control>(`/controls/${id}`),
    linkEvidence: (controlId: string, evidenceIds: number[]) =>
      request<{ linked: number[]; control_id: string }>(
        `/controls/${controlId}/link-evidence`,
        {
          method: "POST",
          body: JSON.stringify({ evidence_ids: evidenceIds }),
        }
      ),
  },

  evidence: {
    list: (controlId = "", search = "") => {
      const params = new URLSearchParams();
      if (controlId) params.set("control_id", controlId);
      if (search) params.set("search", search);
      return request<Evidence[]>(`/evidence?${params}`);
    },
    upload: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return upload<Evidence>("/evidence/upload", fd);
    },
  },

  feedback: {
    create: (controlId: string, text?: string, file?: File) => {
      const fd = new FormData();
      if (text) fd.append("text", text);
      if (file) fd.append("file", file);
      return upload<Feedback>(`/controls/${controlId}/feedback`, fd);
    },
    list: (controlId: string) =>
      request<Feedback[]>(`/controls/${controlId}/feedback`),
  },

  narratives: {
    generate: (body: {
      control_id: string;
      evidence_ids: number[];
      narrative_text?: string;
      feedback_id?: number;
    }) =>
      request<GenerateResult>("/narratives/generate", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    list: (controlId: string) =>
      request<Narrative[]>(`/narratives?control_id=${controlId}`),
  },

  assessments: {
    list: (controlId: string) =>
      request<Assessment[]>(`/assessments?control_id=${controlId}`),
  },

  boards: {
    list: () => request<Board[]>("/boards"),
    cards: (boardId: number) => request<Card[]>(`/boards/${boardId}/cards`),
    createCard: (boardId: number, card: Partial<Card>) =>
      request<Card>(`/boards/${boardId}/cards`, {
        method: "POST",
        body: JSON.stringify(card),
      }),
    updateCard: (cardId: number, updates: Partial<Card>) =>
      request<Card>(`/cards/${cardId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    createCardsFromGaps: (controlId: string, boardId = 1) =>
      request<{ cards_created: number; items?: string[] }>(
        `/controls/${controlId}/create-cards-from-gaps?board_id=${boardId}`,
        { method: "POST" }
      ),
  },

  soc2: {
    targets: () => request<SOC2Target[]>("/soc2/targets"),
    linkEvidence: (soc2Target: string, evidenceId: number, controlId?: string) =>
      request("/soc2/link-evidence", {
        method: "POST",
        body: JSON.stringify({
          soc2_target: soc2Target,
          evidence_id: evidenceId,
          control_id: controlId,
        }),
      }),
    importCrosswalk: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return upload<{ imported: number }>("/crosswalk/import", fd);
    },
  },

  govramp: {
    dashboard: () => request<GovRAMPDashboard>("/govramp/dashboard"),
    stats: () => request<GovRAMPStats>("/govramp/stats"),
    progress: () => request<GovRAMPProgress[]>("/govramp/progress"),
    updateProgress: (tier: string, body: { completion_pct: number; missing_control_ids?: string[] }) =>
      request<GovRAMPProgress>(`/govramp/progress/${tier}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    importJourneyCsv: () =>
      request<{ imported_snapshots: number; latest_period: string | null }>(
        "/govramp/import-journey-csv",
        { method: "POST" }
      ),
    feedback: () => request<GovRAMPFeedback[]>("/govramp/pmo-feedback"),
    uploadFeedback: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return upload<GovRAMPFeedbackUploadResult>("/govramp/pmo-feedback/upload", fd);
    },
  },
};
