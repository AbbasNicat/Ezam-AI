import { describe, expect, it } from "vitest";
import { interpretAgentRequest } from "@/lib/agent/openai";
import { regenerateAlternatives } from "@/lib/agent/regeneration";
import { demoCatalog } from "@/lib/data/catalog";
import { demoRequest } from "@/lib/data/demo-scenario";
import { planTrip, selectedOrFirst } from "@/lib/planning/planner";

describe("multilingual agent to deterministic planner", () => {
  it("interprets Azerbaijani input and produces real catalog packages", async () => {
    const interpreted = await interpretAgentRequest({ message: "Bakıdan İstanbula 2026-10-20 tarixində getmək, 2026-10-22 qayıtmaq istəyirəm. Büdcə 1800 AZN, sakit otel və muzeylər olsun.", preferredLanguage: "az" }, { apiKey: "" });
    const definedInput = Object.fromEntries(Object.entries(interpreted.plannerInput).filter(([, value]) => value !== undefined));
    const request = { ...demoRequest, ...definedInput };
    const plan = planTrip({ request, mode: interpreted.source === "openai" ? "ai" : "basic" });
    expect(interpreted.intent.responseLanguage).toBe("az");
    expect(plan.status).toBe("ok");
    expect(plan.packages).toHaveLength(3);
  });

  it("excludes a rejected hotel and recalculates packages and itinerary", async () => {
    const original = planTrip({ request: demoRequest });
    const selected = selectedOrFirst(original)!;
    const rejectedId = selected.accommodation!.id;
    const regeneration = await regenerateAlternatives({ instruction: "Başqa otel tap.", preferredLanguage: "az", destination: demoRequest.destination, flightId: selected.flight.id, hotelId: rejectedId, excludedOptionIds: [] }, { apiKey: "" });
    const hotels = new Set(regeneration.eligibleHotelIds);
    const flights = new Set(regeneration.eligibleFlightIds);
    const replanned = planTrip({ request: demoRequest, catalog: { ...demoCatalog, stays: demoCatalog.stays.filter((stay) => hotels.has(stay.id)), flights: demoCatalog.flights.filter((flight) => flights.has(flight.id)) } });
    expect(regeneration.excludedOptionIds).toContain(rejectedId);
    expect(replanned.status).toBe("ok");
    expect(replanned.packages.every((pkg) => pkg.accommodation?.id !== rejectedId)).toBe(true);
    expect(replanned.packages.every((pkg) => pkg.itinerary.some((stop) => stop.category === "hotel" && stop.title.includes(pkg.accommodation!.name)))).toBe(true);
    expect(replanned.packages.some((pkg) => pkg.corporateTotal !== selected.corporateTotal)).toBe(true);
  });
});
