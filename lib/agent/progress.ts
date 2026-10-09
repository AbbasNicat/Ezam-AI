import type { AgentLanguage } from "@/lib/agent/schemas";
export type AgentStageStatus = "pending" | "running" | "completed" | "failed";
export type AgentStageId = "understand" | "flights" | "stays" | "restaurants" | "attractions" | "itinerary" | "policy" | "approval" | "budget" | "packages";
export interface AgentProgressEvent { stageId: AgentStageId; status: AgentStageStatus; messageKey: `agent.progress.${AgentStageId}`; language: AgentLanguage; simulation: boolean; metadata?: { candidateCount?: number; durationMs?: number }; error?: { code: string; message: string }; }
export function planningStages(language: AgentLanguage, business = false): AgentProgressEvent[] {
  const ids: AgentStageId[] = ["understand", "flights", "stays", "restaurants", "attractions", "itinerary", ...(business ? ["policy" as const, "approval" as const] : []), "budget", "packages"];
  return ids.map((stageId) => ({ stageId, status: "pending", messageKey: `agent.progress.${stageId}`, language, simulation: stageId === "restaurants" }));
}
