import { afterEach, describe, expect, it } from "vitest";
import { buildInterpretation, fallbackIntent } from "@/lib/agent/fallback";
import { interpretAgentRequest } from "@/lib/agent/openai";
import { regenerateAlternatives } from "@/lib/agent/regeneration";
import { planningStages } from "@/lib/agent/progress";
import { demoRequest } from "@/lib/data/demo-scenario";
import { planTrip } from "@/lib/planning/planner";
import type { CorporatePolicy } from "@/types/travel";

const originalKey = process.env.OPENAI_API_KEY;
afterEach(() => { if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey; });

function mockFetch(payload: unknown): typeof fetch {
  return async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(payload) } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
}

const baseModel = {
  detectedLanguage: "en", responseLanguage: "en", languageConfidence: .99, origin: "Baku", destination: "Istanbul",
  departureDate: "2026-10-20", returnDate: "2026-10-22", travelerCount: 1, totalBudget: 1800, currency: "AZN", purpose: "Business meeting",
  travelStyle: "balanced", accommodationType: "either", accommodationLevel: "standard", locationPreferences: [], restaurantPreferences: [], cuisinePreferences: [], attractionPreferences: [], transportPreferences: [], flightCabin: "economy", accessibilityNeeds: [], hardConstraints: [], softPreferences: [], specialRequests: [], requiresMichelinVerification: false,
};

describe("multilingual travel agent", () => {
  it("parses an Azerbaijani luxury hotel request", () => { const x = fallbackIntent("Bakıda 4 günlük səyahət istəyirəm. 2500 AZN büdcəm var. Turistik yerlərə yaxın beşulduzlu otel tap."); expect(x.detectedLanguage).toBe("az"); expect(x.destination).toBe("Baku"); expect(x.totalBudget).toBe(2500); expect(x.travelStyle).toBe("luxury"); });
  it("detects informal Azerbaijani without diacritics", () => { const x = fallbackIntent("Bakida 4 gun qalmaq isteyirem, yaxshi 5 ulduzlu hotel olsun, restoranlara yaxin."); expect(x.detectedLanguage).toBe("az"); expect(x.hotelStars).toBe(5); });
  it("detects a Turkish four-day vacation", () => { const x = fallbackIntent("Bakü'de 4 gün geçirmek istiyorum. Beş yıldızlı otel olsun, bütçem 2500 AZN."); expect(x.detectedLanguage).toBe("tr"); expect(x.durationDays).toBe(4); });
  it("extracts an English business trip", () => { const x = fallbackIntent("Business meeting from Baku to Istanbul, 1800 AZN, economy, 2026-10-20 to 2026-10-22."); expect(x.purpose).toBe("Business meeting"); expect(x.origin).toBe("Baku"); expect(x.destination).toBe("Istanbul"); });
  it("handles mixed Azerbaijani and English hotel terminology", () => { const x = fallbackIntent("Istanbulda quiet hotel istəyirəm, city center yaxın olsun."); expect(x.detectedLanguage).toBe("az"); expect(x.locationPreferences).toContain("quiet neighborhood"); });
  it("asks for a missing destination", () => { const r = buildInterpretation(fallbackIntent("I have 1800 AZN for a trip."), "fallback"); expect(r.clarificationQuestions[0]).toContain("Which city"); });
  it("asks for missing dates", () => { const r = buildInterpretation(fallbackIntent("Baku to Istanbul with 1800 AZN."), "fallback"); expect(r.clarificationQuestions).toContain("What are your departure and return dates?"); });
  it("extracts a strict budget as a hard maximum", () => { const x = fallbackIntent("Istanbul trip must not exceed 2000 AZN."); expect(x.hardConstraints).toContainEqual(expect.objectContaining({ field: "totalBudget", operator: "maximum", value: 2000 })); });
  it("extracts a required five-star hotel", () => { const x = fallbackIntent("The hotel must be 5 star in Istanbul."); expect(x.hotelStars).toBe(5); expect(x.hardConstraints).toContainEqual(expect.objectContaining({ field: "hotelStars" })); });
  it("flags Michelin as requiring independent verification", () => { const r = buildInterpretation(fallbackIntent("I want a Michelin restaurant near my Istanbul hotel."), "fallback"); expect(r.intent.requiresMichelinVerification).toBe(true); expect(r.warnings.join(" ")).toContain("Michelin"); });
  it("extracts near-attractions preferences", () => { expect(fallbackIntent("Hotel near major attractions in Istanbul.").locationPreferences).toContain("near major attractions"); });
  it("leaves forbidden cabins to the deterministic policy engine", () => { const policy: CorporatePolicy = { id:"economy", companyName:"Caspian Ventures", allowedCabins:["economy"], maxHotelNightly:280, currency:"AZN", dailyMealAllowance:45, dailyGroundTransportAllowance:25, approvalThreshold:1200, leisureReimbursable:false, requiredApprovalRoles:["travel_manager"] }; const plan = planTrip({ request:{...demoRequest,cabinPreference:"business"}, policy }); expect(plan.status).toBe("ok"); expect(plan.packages.every((pkg)=>pkg.flight.attributes.cabin === "economy" && pkg.policyEvaluation.compliant)).toBe(true); });
  it("understands Azerbaijani hotel regeneration", async () => { const r = await regenerateAlternatives({ instruction:"Başqa otel tap.", preferredLanguage:"az", destination:"Istanbul", hotelId:"stay-ist-sultan", flightId:"flight-ist-azal", excludedOptionIds:[] }, { apiKey:"" }); expect(r.intent.action).toBe("replace_hotel"); expect(r.excludedOptionIds).toContain("stay-ist-sultan"); });
  it("understands Turkish hotel regeneration", async () => { const r = await regenerateAlternatives({ instruction:"Başka bir otel bul.", preferredLanguage:"tr", destination:"Istanbul", hotelId:"stay-ist-sultan", excludedOptionIds:[] }, { apiKey:"" }); expect(r.intent.language).toBe("tr"); expect(r.intent.action).toBe("replace_hotel"); });
  it("never returns the rejected hotel as eligible", async () => { const r = await regenerateAlternatives({ instruction:"Find another hotel.", destination:"Istanbul", hotelId:"stay-ist-sultan", excludedOptionIds:[] }, { apiKey:"" }); expect(r.eligibleHotelIds).not.toContain("stay-ist-sultan"); });
  it("uses fallback when the API key is missing", async () => { delete process.env.OPENAI_API_KEY; const r = await interpretAgentRequest({ message:"Baku to Istanbul, 1800 AZN." }); expect(r.source).toBe("fallback"); });
  it("uses fallback on timeout", async () => { const r = await interpretAgentRequest({ message:"Baku to Istanbul, 1800 AZN." }, { apiKey:"test", timeoutMs:1, fetcher:async()=>{ throw new DOMException("timeout","AbortError"); } }); expect(r.source).toBe("fallback"); });
  it("rejects malformed model output", async () => { const r = await interpretAgentRequest({ message:"Baku to Istanbul." }, { apiKey:"test", fetcher:mockFetch({ detectedLanguage:"xx" }) }); expect(r.source).toBe("fallback"); });
  it("reports a model-extracted unsupported city", async () => { const r = await interpretAgentRequest({ message:"Trip to Paris." }, { apiKey:"test", fetcher:mockFetch({ ...baseModel, destination:"Paris" }) }); expect(r.source).toBe("openai"); expect(r.warnings[0]).toContain("not available"); });
  it("honors user-selected language over model detection", async () => { const r = await interpretAgentRequest({ message:"Istanbul trip.", preferredLanguage:"az" }, { apiKey:"test", fetcher:mockFetch({ ...baseModel, detectedLanguage:"en", responseLanguage:"en" }) }); expect(r.intent.responseLanguage).toBe("az"); expect(r.response).toMatch(/Səyahət/); });
  it("provides typed business progress stages", () => { const stages = planningStages("tr", true); expect(stages.map((x)=>x.stageId)).toEqual(expect.arrayContaining(["policy","approval","packages"])); expect(stages.find((x)=>x.stageId==="restaurants")?.simulation).toBe(true); });
});
