import type { AgentLanguage } from "@/lib/agent/schemas";

const KEY = "atlasflow.agent-state.v1";
export interface PersistedAgentState { language: AgentLanguage; excludedOptionIds: string[]; }
export function loadAgentState(): PersistedAgentState { if (typeof window === "undefined") return { language: "en", excludedOptionIds: [] }; try { const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as PersistedAgentState | null; return parsed?.language ? parsed : { language: "en", excludedOptionIds: [] }; } catch { return { language: "en", excludedOptionIds: [] }; } }
export function saveAgentState(state: PersistedAgentState): void { if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state)); }
export function clearAgentState(): void { if (typeof window !== "undefined") window.localStorage.removeItem(KEY); }
