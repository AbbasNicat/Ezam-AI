import { describe, expect, it } from "vitest";
import { demoRequest } from "@/lib/data/demo-scenario";
import { planTrip } from "@/lib/planning/planner";
import { buildFinanceCsv, createTripRecord, openHandoff, submitForApproval, decideApproval } from "@/lib/workflow/trip-state";

describe("Caspian demo plan", () => {
  it("returns three distinct feasible packages inside 1800 AZN", () => {
    const plan = planTrip({ request: demoRequest });
    expect(plan.status).toBe("ok");
    expect(plan.packages.map((pkg) => pkg.tier)).toEqual(["economy", "balanced", "comfort"]);
    const keys = new Set(plan.packages.map((pkg) => `${pkg.flight.id}|${pkg.accommodation?.id}`));
    expect(keys.size).toBe(3);
    for (const pkg of plan.packages) {
      expect(pkg.corporateTotal).toBeLessThanOrEqual(1800);
      expect(pkg.policyEvaluation.compliant).toBe(true);
      expect(pkg.policyEvaluation.violations).toHaveLength(0);
      expect(pkg.costBreakdown.every((line) => line.estimated)).toBe(true);
      const leisure = pkg.costBreakdown.filter((line) => line.category === "leisure" || line.category === "shopping");
      expect(leisure.every((line) => line.payer === "personal")).toBe(true);
    }
  });

  it("does not mark a booking confirmed when a handoff opens", () => {
    const plan = planTrip({ request: demoRequest });
    let record = createTripRecord(demoRequest, plan, "Employee", "2026-10-09T10:00:00.000Z");
    record = openHandoff(record, "flights", "Employee", "2026-10-09T10:01:00.000Z");
    expect(record.handoff.flights).toBe("external_search_opened");
    record = submitForApproval(record, "Employee", "2026-10-09T10:02:00.000Z");
    record = decideApproval(record, "approved", "Ok", "Travel manager", "2026-10-09T10:03:00.000Z");
    const csv = buildFinanceCsv(record);
    expect(csv).toContain("approved");
    expect(csv).toContain("external_search_opened");
    expect(csv).not.toContain("confirmed_by_user");
  });
});
