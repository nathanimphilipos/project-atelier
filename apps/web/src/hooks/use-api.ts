"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useControls(search = "") {
  return useQuery({
    queryKey: ["controls", search],
    queryFn: () => api.controls.list(search),
  });
}

export function useControl(controlId: string) {
  return useQuery({
    queryKey: ["control", controlId],
    queryFn: () => api.controls.get(controlId),
    enabled: !!controlId,
  });
}

export function useEvidence(controlId = "", search = "") {
  return useQuery({
    queryKey: ["evidence", controlId, search],
    queryFn: () => api.evidence.list(controlId, search),
  });
}

export function useUploadEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.evidence.upload(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evidence"] });
    },
  });
}

export function useLinkEvidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      controlId,
      evidenceIds,
    }: {
      controlId: string;
      evidenceIds: number[];
    }) => api.controls.linkEvidence(controlId, evidenceIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evidence"] });
      qc.invalidateQueries({ queryKey: ["controls"] });
    },
  });
}

export function useFeedback(controlId: string) {
  return useQuery({
    queryKey: ["feedback", controlId],
    queryFn: () => api.feedback.list(controlId),
    enabled: !!controlId,
  });
}

export function useCreateFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      controlId,
      text,
      file,
    }: {
      controlId: string;
      text?: string;
      file?: File;
    }) => api.feedback.create(controlId, text, file),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["feedback", vars.controlId] });
    },
  });
}

export function useNarratives(controlId: string) {
  return useQuery({
    queryKey: ["narratives", controlId],
    queryFn: () => api.narratives.list(controlId),
    enabled: !!controlId,
  });
}

export function useAssessments(controlId: string) {
  return useQuery({
    queryKey: ["assessments", controlId],
    queryFn: () => api.assessments.list(controlId),
    enabled: !!controlId,
  });
}

export function useGenerateNarrative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      control_id: string;
      evidence_ids: number[];
      narrative_text?: string;
      feedback_id?: number;
    }) => api.narratives.generate(body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["narratives", vars.control_id] });
      qc.invalidateQueries({ queryKey: ["assessments", vars.control_id] });
      qc.invalidateQueries({ queryKey: ["controls"] });
    },
  });
}

export function useBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: () => api.boards.list(),
  });
}

export function useBoardCards(boardId: number) {
  return useQuery({
    queryKey: ["board-cards", boardId],
    queryFn: () => api.boards.cards(boardId),
    enabled: boardId > 0,
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      boardId,
      card,
    }: {
      boardId: number;
      card: Partial<import("@/lib/types").Card>;
    }) => api.boards.createCard(boardId, card),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board-cards"] });
      qc.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      updates,
    }: {
      cardId: number;
      updates: Partial<import("@/lib/types").Card>;
    }) => api.boards.updateCard(cardId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board-cards"] });
    },
  });
}

export function useCreateCardsFromGaps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      controlId,
      boardId,
    }: {
      controlId: string;
      boardId?: number;
    }) => api.boards.createCardsFromGaps(controlId, boardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board-cards"] });
      qc.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useSOC2Targets() {
  return useQuery({
    queryKey: ["soc2-targets"],
    queryFn: () => api.soc2.targets(),
  });
}

export function useLinkSOC2Evidence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      soc2Target,
      evidenceId,
      controlId,
    }: {
      soc2Target: string;
      evidenceId: number;
      controlId?: string;
    }) => api.soc2.linkEvidence(soc2Target, evidenceId, controlId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["soc2-targets"] });
    },
  });
}

export function useImportCrosswalk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.soc2.importCrosswalk(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["soc2-targets"] });
    },
  });
}

export function useGovRAMPDashboard() {
  return useQuery({
    queryKey: ["govramp-dashboard"],
    queryFn: () => api.govramp.dashboard(),
  });
}

export function useGovRAMPStats() {
  return useQuery({
    queryKey: ["govramp-stats"],
    queryFn: () => api.govramp.stats(),
  });
}

export function useGovRAMPProgress() {
  return useQuery({
    queryKey: ["govramp-progress"],
    queryFn: () => api.govramp.progress(),
  });
}

export function useGovRAMPFeedback() {
  return useQuery({
    queryKey: ["govramp-feedback"],
    queryFn: () => api.govramp.feedback(),
  });
}

export function useUpdateGovRAMPProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tier,
      body,
    }: {
      tier: string;
      body: { completion_pct: number; missing_control_ids?: string[] };
    }) => api.govramp.updateProgress(tier, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["govramp-progress"] });
      qc.invalidateQueries({ queryKey: ["govramp-dashboard"] });
      qc.invalidateQueries({ queryKey: ["govramp-stats"] });
    },
  });
}

export function useImportJourneyCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.govramp.importJourneyCsv(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["govramp-dashboard"] });
      qc.invalidateQueries({ queryKey: ["govramp-progress"] });
      qc.invalidateQueries({ queryKey: ["govramp-stats"] });
    },
  });
}

export function useUploadGovRAMPFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.govramp.uploadFeedback(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["govramp-feedback"] });
      qc.invalidateQueries({ queryKey: ["govramp-stats"] });
    },
  });
}
