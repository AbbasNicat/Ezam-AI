import type { DemoRole, TripRecord } from "@/types/travel";
import type { RequestFormValues } from "@/lib/data/demo-scenario";

const KEY = "atlasflow.demo.v1";

export interface PersistedDemo {
  role: DemoRole;
  record: TripRecord | null;
  draft: RequestFormValues;
  interpretationNotes: string[];
}

export function loadDemo(): PersistedDemo | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedDemo;
  } catch {
    return null;
  }
}

export function saveDemo(state: PersistedDemo): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearDemo(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
