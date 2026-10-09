import { planCheapestFirst, type PlanInput } from "@/lib/planning/planner";
import type { PlanResult, TravelRequest } from "@/types/travel";

export interface PlannerMetrics {
  name: string;
  scenarios: number;
  withPackage: number;
  feasible: number;
  withinBudget: number;
  hardViolations: number;
  preferenceTotal: number;
  preferenceSamples: number;
  estimatedCostAzn: number;
  durationMs: number;
}

export function planBaseline(input: PlanInput): PlanResult {
  return planCheapestFirst(input);
}

export function summarize(name: string, results: PlanResult[], durationMs: number): PlannerMetrics {
  let withPackage = 0;
  let feasible = 0;
  let withinBudget = 0;
  let hardViolations = 0;
  let preferenceTotal = 0;
  let preferenceSamples = 0;
  let estimatedCostAzn = 0;
  for (const result of results) {
    const pkg = result.packages[0];
    if (!pkg) {
      if (result.status === "NO_FEASIBLE_PLAN") hardViolations += 1;
      continue;
    }
    withPackage += 1;
    const hard = pkg.policyEvaluation.violations.length;
    hardViolations += hard;
    if (pkg.remainingBudgetAzn >= 0) withinBudget += 1;
    if (result.status === "ok" && hard === 0 && pkg.remainingBudgetAzn >= 0) feasible += 1;
    preferenceTotal += pkg.preferenceScore;
    preferenceSamples += 1;
    estimatedCostAzn += pkg.corporateTotalAzn;
  }
  return {
    name,
    scenarios: results.length,
    withPackage,
    feasible,
    withinBudget,
    hardViolations,
    preferenceTotal,
    preferenceSamples,
    estimatedCostAzn,
    durationMs,
  };
}

export function isComparable(request: TravelRequest): boolean {
  return Boolean(request.origin && request.destination && request.departureDate && request.returnDate);
}
