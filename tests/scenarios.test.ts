import { describe, expect, it } from "vitest";
import { demoCatalog } from "@/lib/data/catalog";
import { demoRequest } from "@/lib/data/demo-scenario";
import { caspianPolicy } from "@/lib/data/policies";
import { acceptModelPayload, interpretTravelText } from "@/lib/ai/fallback";
import { parseTravelRequest } from "@/lib/ai/provider";
import { summarize } from "@/lib/planning/baseline";
import { planCheapestFirst, planTrip, selectedOrFirst } from "@/lib/planning/planner";
import { majorToAznCents } from "@/lib/utils/money";
import type { Catalog, CorporatePolicy, FlightItem, PlanResult, TravelRequest } from "@/types/travel";
import {
  buildFinanceCsv,
  createTripRecord,
  decideApproval,
  openHandoff,
  submitForApproval,
} from "@/lib/workflow/trip-state";

function request(patch: Partial<TravelRequest> = {}): TravelRequest {
  return {
    ...demoRequest,
    interests: patch.interests ? [...patch.interests] : [...demoRequest.interests],
    meetings: patch.meetings ? patch.meetings.map((meeting) => ({ ...meeting })) : demoRequest.meetings.map((meeting) => ({ ...meeting })),
    ...patch,
  };
}

function policy(patch: Partial<CorporatePolicy> = {}): CorporatePolicy {
  return {
    ...caspianPolicy,
    allowedCabins: patch.allowedCabins ? [...patch.allowedCabins] : [...caspianPolicy.allowedCabins],
    ...patch,
  };
}

function corporateCents(plan: PlanResult, index = 0): number {
  const pkg = plan.packages[index];
  if (!pkg) return 0;
  return pkg.costBreakdown
    .filter((line) => line.payer === "corporate")
    .reduce((sum, line) => sum + Math.round(line.amountAzn * 100), 0);
}

function seededFlightCities(): string[] {
  return [...new Set(demoCatalog.flights.map((flight) => flight.destination.toLowerCase()))];
}

function equalPricePairs(): Array<{ left: string; right: string; cost: number }> {
  const pairs: Array<{ left: string; right: string; cost: number }> = [];
  const seen: Array<{ key: string; cost: number }> = [];
  const flights = demoCatalog.flights.filter((flight) => flight.origin === "Baku" && flight.destination === "Istanbul");
  const stays = demoCatalog.stays.filter((stay) => stay.city === "Istanbul");
  for (const flight of flights) {
    for (const stay of stays) {
      const plan = planTrip({
        request: demoRequest,
        catalog: { ...demoCatalog, flights: [flight], stays: [stay] },
      });
      if (plan.status !== "ok" || !plan.packages[0]) continue;
      const key = `${flight.id}|${stay.id}`;
      const cost = plan.packages[0].corporateTotalAzn;
      const match = seen.find((item) => item.cost === cost);
      if (match) pairs.push({ left: match.key, right: key, cost });
      seen.push({ key, cost });
    }
  }
  return pairs;
}

const priceTies = equalPricePairs();
const citiesMissingStays = seededFlightCities().filter(
  (city) => !demoCatalog.stays.some((stay) => stay.city.toLowerCase() === city),
);

describe("spec scenarios", () => {
  it("1 normal trip within budget", () => {
    const plan = planTrip({ request: demoRequest });
    expect(plan.status).toBe("ok");
    expect(plan.packages.map((pkg) => pkg.tier)).toEqual(["economy", "balanced", "comfort"]);
    expect(new Set(plan.packages.map((pkg) => `${pkg.flight.id}|${pkg.accommodation?.id}`)).size).toBe(3);
    for (const pkg of plan.packages) {
      expect(pkg.corporateTotal).toBeLessThanOrEqual(1800);
      expect(pkg.remainingBudgetAzn).toBeGreaterThanOrEqual(0);
      expect(pkg.policyEvaluation.violations).toHaveLength(0);
      expect(corporateCents(plan, plan.packages.indexOf(pkg))).toBe(Math.round(pkg.corporateTotalAzn * 100));
    }
  });

  it("2 budget too low", () => {
    const plan = planTrip({ request: request({ corporateBudget: 80, id: "low-budget" }) });
    expect(plan.status).toBe("NO_FEASIBLE_PLAN");
    expect(plan.packages).toHaveLength(0);
    expect(plan.suggestedFixes.join(" ").toLowerCase()).toContain("budget");
  });

  it("3 business class prohibited", () => {
    const plan = planTrip({
      request: request({ cabinPreference: "business", id: "business-pref" }),
    });
    expect(plan.status).toBe("ok");
    expect(plan.packages.length).toBeGreaterThan(0);
    for (const pkg of plan.packages) {
      expect(pkg.flight.attributes.cabin).not.toBe("business");
      expect(["economy", "premium_economy"]).toContain(pkg.flight.attributes.cabin);
    }
    const warnings = plan.packages.flatMap((pkg) => pkg.policyEvaluation.warnings.map((item) => item.message)).join(" ");
    expect(warnings.toLowerCase()).toContain("business");
    expect(warnings.toLowerCase()).toContain("not permitted");
  });

  it("4 hotel nightly cap exceeded", () => {
    const plan = planTrip({
      request: demoRequest,
      policy: policy({ maxHotelNightly: 90 }),
    });
    expect(plan.status).toBe("NO_FEASIBLE_PLAN");
    expect(plan.packages).toHaveLength(0);
    expect(plan.suggestedFixes.join(" ").toLowerCase()).toMatch(/nightly|cap/);
    const allowed = planTrip({ request: demoRequest });
    expect(allowed.packages.every((pkg) => Number(pkg.accommodation?.attributes.nightlyAzn) <= 280)).toBe(true);
    expect(allowed.packages.some((pkg) => pkg.accommodation?.id === "stay-ist-bosphorus")).toBe(false);
  });

  it("5 personal leisure excluded from corporate reimbursement", () => {
    const plan = planTrip({ request: demoRequest });
    expect(plan.status).toBe("ok");
    const pkg = plan.packages[0];
    expect(pkg).toBeDefined();
    const leisure = pkg!.costBreakdown.filter((line) => line.category === "leisure" || line.category === "shopping");
    expect(leisure.length).toBeGreaterThan(0);
    expect(leisure.every((line) => line.payer === "personal")).toBe(true);
    expect(pkg!.personalTotalAzn).toBeGreaterThan(0);
    expect(corporateCents({ ...plan, packages: [pkg!] })).toBe(Math.round(pkg!.corporateTotalAzn * 100));
  });

  it("6 apartment preference", () => {
    const plan = planTrip({
      request: request({ accommodationPreference: "apartment", id: "apartments" }),
    });
    expect(plan.status).toBe("ok");
    expect(plan.packages.every((pkg) => pkg.accommodation?.type === "apartment")).toBe(true);
  });

  it("7 hotel preference", () => {
    const plan = planTrip({
      request: request({ accommodationPreference: "hotel", id: "hotels" }),
    });
    expect(plan.status).toBe("ok");
    expect(plan.packages.every((pkg) => pkg.accommodation?.type === "hotel")).toBe(true);
  });

  it("8 tight meeting schedule", () => {
    const plan = planTrip({
      request: request({
        id: "tight-meeting",
        meetings: [
          {
            title: "All-day client workshop",
            date: "2026-10-21",
            startTime: "08:00",
            endTime: "19:00",
            locationName: "Levent client office",
            lat: 41.0815,
            lng: 29.0118,
          },
        ],
      }),
    });
    expect(plan.status).toBe("ok");
    for (const pkg of plan.packages) {
      const leisure = pkg.itinerary.filter((stop) => stop.day === "2026-10-21" && stop.category === "attraction");
      expect(leisure).toHaveLength(0);
    }
  });

  it("9 same-day travel", () => {
    const plan = planTrip({
      request: request({
        id: "same-day",
        departureDate: "2026-10-20",
        returnDate: "2026-10-20",
        meetings: [],
      }),
    });
    expect(plan.status).toBe("ok");
    for (const pkg of plan.packages) {
      expect(pkg.nights).toBe(0);
      expect(pkg.accommodation).toBeNull();
      expect(pkg.costBreakdown.some((line) => line.category === "accommodation")).toBe(false);
      expect(pkg.corporateTotal).toBeLessThanOrEqual(1800);
    }
  });

  it("10 invalid date range", () => {
    const plan = planTrip({
      request: request({ id: "bad-dates", departureDate: "2026-10-22", returnDate: "2026-10-20" }),
    });
    expect(plan.status).toBe("INVALID_REQUEST");
    expect(plan.packages).toHaveLength(0);
    expect(plan.suggestedFixes.join(" ").toLowerCase()).toContain("return");
  });

  it("11 unsupported city", () => {
    const plan = planTrip({ request: request({ id: "paris", destination: "Paris" }) });
    expect(plan.status).toBe("NO_FEASIBLE_PLAN");
    expect(plan.packages).toHaveLength(0);
    expect(plan.reasons.join(" ").toLowerCase()).toMatch(/flight|paris/);
    expect(plan.suggestedFixes.join(" ")).toMatch(/Istanbul|Tbilisi|Dubai/);
  });

  it("12 missing optional preferences", () => {
    const plan = planTrip({
      request: request({
        id: "sparse",
        interests: [],
        specialRequirements: "",
        leisureEnabled: false,
        personalLeisureBudget: 0,
        meetings: [],
        accommodationLevel: "standard",
      }),
    });
    expect(plan.status).toBe("ok");
    expect(plan.packages.length).toBeGreaterThan(0);
    expect(plan.packages.every((pkg) => pkg.personalTotalAzn === 0)).toBe(true);
  });

  it("13 no valid flight option", () => {
    const plan = planTrip({ request: request({ id: "no-flight", origin: "Ganja" }) });
    expect(plan.status).toBe("NO_FEASIBLE_PLAN");
    expect(plan.packages).toHaveLength(0);
    expect(plan.reasons.join(" ").toLowerCase()).toContain("flight");
  });

  it.skipIf(citiesMissingStays.length === 0)("14 no valid accommodation in the seeded catalog", () => {
    expect(citiesMissingStays.length).toBeGreaterThan(0);
  });

  it.skipIf(priceTies.length === 0)("15 multiple equally priced packages in the seeded catalog", () => {
    expect(priceTies.length).toBeGreaterThan(0);
  });

  it("16 currency handling", () => {
    expect(majorToAznCents(100, "USD")).toBe(17000);
    const plan = planTrip({
      request: request({
        id: "usd",
        currency: "USD",
        corporateBudget: 1500,
        personalLeisureBudget: 100,
      }),
    });
    expect(plan.status).toBe("ok");
    for (const pkg of plan.packages) {
      expect(pkg.flight.currency).toBe("USD");
      expect(pkg.corporateTotal).toBeLessThanOrEqual(1500);
      expect(pkg.costBreakdown.every((line) => line.currency === "USD" && line.estimated)).toBe(true);
      expect(pkg.corporateTotalAzn).toBeLessThanOrEqual(1500 * 1.7 + 0.01);
    }
  });

  it("17 approval required", () => {
    const plan = planTrip({ request: demoRequest, policy: policy({ approvalThreshold: 1 }) });
    expect(plan.status).toBe("ok");
    expect(plan.packages.every((pkg) => pkg.policyEvaluation.approvalRequired)).toBe(true);
  });

  it("18 approval not required", () => {
    const plan = planTrip({ request: demoRequest, policy: policy({ approvalThreshold: 1_000_000 }) });
    expect(plan.status).toBe("ok");
    expect(plan.packages.every((pkg) => pkg.policyEvaluation.approvalRequired === false)).toBe(true);
  });

  it("19 AI provider unavailable", async () => {
    const previousKey = process.env.LLM_API_KEY;
    const previousModel = process.env.LLM_MODEL;
    delete process.env.LLM_API_KEY;
    delete process.env.LLM_MODEL;
    const result = await parseTravelRequest("Client meeting in Istanbul from Baku. Budget 1800 AZN.", {
      destination: "Istanbul",
    });
    if (previousKey === undefined) delete process.env.LLM_API_KEY;
    else process.env.LLM_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.LLM_MODEL;
    else process.env.LLM_MODEL = previousModel;
    expect(result.mode).toBe("basic");
    expect(result.usedModel).toBe(false);
    expect(result.parsed.destination).toBe("Istanbul");
  });

  it("20 malformed AI response", () => {
    expect(acceptModelPayload({ corporateBudget: "lots", destination: 12 })).toBeNull();
    const result = interpretTravelText({
      text: "Meeting in Istanbul from Baku",
      context: { destination: "Istanbul" },
      modelPayload: { corporateBudget: "lots", destination: "Atlantis", fare: 10 },
    });
    expect(result.mode).toBe("basic");
    expect(result.usedModel).toBe(false);
    expect(result.rejectedClaims.join(" ")).toMatch(/malformed/i);
    expect(result.parsed.notes.join(" ")).toMatch(/schema/i);
  });
});

describe("catalog gaps and fixtures", () => {
  it("records that every seeded flight city has a stay", () => {
    expect(citiesMissingStays).toEqual([]);
  });

  it("fixture: empty stay list returns NO_FEASIBLE_PLAN", () => {
    const catalog: Catalog = { ...demoCatalog, stays: [] };
    const plan = planTrip({ request: demoRequest, catalog });
    expect(plan.status).toBe("NO_FEASIBLE_PLAN");
    expect(plan.packages).toHaveLength(0);
    expect(plan.suggestedFixes.join(" ").toLowerCase()).toMatch(/accommodation/);
  });

  it("records seeded equal-price pairs", () => {
    expect(Array.isArray(priceTies)).toBe(true);
  });

  it("fixture: equal flight prices tie-break by id", () => {
    const template = demoCatalog.flights.find((flight) => flight.id === "flt-azal-gyd-ist-eco");
    const stay = demoCatalog.stays.find((item) => item.id === "stay-ist-sultan-inn");
    expect(template).toBeDefined();
    expect(stay).toBeDefined();
    const flights: FlightItem[] = [
      { ...template!, id: "flt-b", priceAzn: 500 },
      { ...template!, id: "flt-a", priceAzn: 500 },
    ];
    const plan = planTrip({
      request: request({ leisureEnabled: false, personalLeisureBudget: 0, interests: [] }),
      catalog: { ...demoCatalog, flights, stays: [stay!] },
    });
    expect(plan.status).toBe("ok");
    expect(plan.packages[0]?.flight.id).toBe("flt-a");
    const keys = plan.packages.map((pkg) => pkg.flight.id);
    expect(new Set(keys).size).toBe(plan.packages.length);
  });
});

describe("cheapest-first baseline", () => {
  const cases: Array<{ name: string; request: TravelRequest; policy?: CorporatePolicy }> = [
    { name: "normal", request: demoRequest },
    { name: "apartment preference", request: request({ accommodationPreference: "apartment" }) },
    { name: "hotel preference", request: request({ accommodationPreference: "hotel" }) },
    { name: "business preference", request: request({ cabinPreference: "business" }) },
    { name: "low budget", request: request({ corporateBudget: 80 }) },
    { name: "nightly cap 90", request: demoRequest, policy: policy({ maxHotelNightly: 90 }) },
    { name: "usd budget", request: request({ currency: "USD", corporateBudget: 1500, personalLeisureBudget: 100 }) },
    { name: "same day", request: request({ departureDate: "2026-10-20", returnDate: "2026-10-20", meetings: [] }) },
    { name: "no optional prefs", request: request({ interests: [], specialRequirements: "", leisureEnabled: false, personalLeisureBudget: 0, meetings: [] }) },
    { name: "apartments only policy", request: demoRequest, policy: policy({ accommodationRestriction: "apartment" }) },
    { name: "premium economy only", request: demoRequest, policy: policy({ allowedCabins: ["premium_economy"] }) },
  ];

  it("compares constraint failures without claiming an unmeasured win", () => {
    const atlasPlans: PlanResult[] = [];
    const baselinePlans: PlanResult[] = [];
    const rows: Array<Record<string, string | number | boolean>> = [];
    let atlasMs = 0;
    let baselineMs = 0;
    for (const item of cases) {
      const started = performance.now();
      const atlas = planTrip({ request: item.request, policy: item.policy });
      atlasMs += performance.now() - started;
      const baseStarted = performance.now();
      const baseline = planCheapestFirst({ request: item.request, policy: item.policy });
      baselineMs += performance.now() - baseStarted;
      atlasPlans.push(atlas);
      baselinePlans.push(baseline);
      const atlasPkg = selectedOrFirst(atlas);
      const basePkg = baseline.packages[0];
      rows.push({
        scenario: item.name,
        atlasStatus: atlas.status,
        baselineStatus: baseline.status,
        atlasPackages: atlas.packages.length,
        atlasCorporateAzn: atlasPkg?.corporateTotalAzn ?? "",
        baselineCorporateAzn: basePkg?.corporateTotalAzn ?? "",
        atlasPreference: atlasPkg ? Number(atlasPkg.preferenceScore.toFixed(3)) : "",
        baselinePreference: basePkg ? Number(basePkg.preferenceScore.toFixed(3)) : "",
        atlasViolations: atlasPkg?.policyEvaluation.violations.length ?? (atlas.status === "NO_FEASIBLE_PLAN" ? 1 : 0),
        baselineViolations: basePkg?.policyEvaluation.violations.length ?? (baseline.status === "NO_FEASIBLE_PLAN" ? 1 : 0),
        atlasFeasible: atlas.status === "ok",
        baselineFeasible: baseline.status === "ok",
      });
      if (atlas.status === "ok") {
        expect(atlas.packages.every((pkg) => pkg.policyEvaluation.violations.length === 0)).toBe(true);
        expect(atlas.packages.every((pkg) => pkg.remainingBudgetAzn >= 0)).toBe(true);
      }
    }

    const apartmentPolicy = rows.find((row) => row.scenario === "apartments only policy");
    expect(apartmentPolicy?.atlasFeasible).toBe(true);
    expect(apartmentPolicy?.baselineFeasible).toBe(false);

    const premiumOnly = rows.find((row) => row.scenario === "premium economy only");
    expect(premiumOnly?.atlasFeasible).toBe(true);
    expect(premiumOnly?.baselineFeasible).toBe(false);

    const atlasSummary = summarize("AtlasFlow", atlasPlans, atlasMs);
    const baselineSummary = summarize("Cheapest-first", baselinePlans, baselineMs);
    console.log(`BASELINE_ROWS ${JSON.stringify(rows)}`);
    console.log(`BASELINE_SUMMARY ${JSON.stringify({ atlas: atlasSummary, baseline: baselineSummary })}`);
    console.log(`SEEDED_GAPS ${JSON.stringify({ citiesMissingStays, priceTieCount: priceTies.length })}`);
  });
});

describe("workflow stages on the demo plan", () => {
  it("completes request, plan, policy, selection, handoff, approval, and csv", () => {
    const plan = planTrip({ request: demoRequest });
    let record = createTripRecord(demoRequest, plan, "Employee", "2026-10-09T10:00:00.000Z");
    record = openHandoff(record, "flights", "Employee", "2026-10-09T10:01:00.000Z");
    record = submitForApproval(record, "Employee", "2026-10-09T10:02:00.000Z");
    record = decideApproval(record, "approved", "Approved in the demo.", "Travel manager", "2026-10-09T10:03:00.000Z");
    const csv = buildFinanceCsv(record);
    const stages = [
      record.audit.some((event) => event.type === "request_created"),
      record.audit.some((event) => event.type === "plan_generated"),
      record.audit.some((event) => event.type === "policy_evaluated"),
      record.audit.some((event) => event.type === "package_selected"),
      (record.plan.packages.find((pkg) => pkg.id === record.selectedPackageId)?.itinerary.length ?? 0) > 0,
      record.handoff.flights === "external_search_opened",
      record.approval.status === "approved",
      csv.includes("corporate_total") && csv.includes("personal_total"),
    ];
    expect(stages.every(Boolean)).toBe(true);
    console.log(`WORKFLOW_STAGES ${stages.filter(Boolean).length}/${stages.length}`);
  });
});
