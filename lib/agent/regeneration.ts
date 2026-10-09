import { demoCatalog } from "@/lib/data/catalog";
import { t } from "@/lib/agent/i18n";
import { interpretRegeneration, type AgentRuntimeOptions } from "@/lib/agent/openai";
import type { AgentLanguage, RegenerationResult } from "@/lib/agent/schemas";

export async function regenerateAlternatives(input: { instruction: string; preferredLanguage?: AgentLanguage; destination?: string; flightId?: string; hotelId?: string; excludedOptionIds: string[] }, options: AgentRuntimeOptions = {}): Promise<RegenerationResult> {
  const interpreted = await interpretRegeneration({ instruction: input.instruction, preferredLanguage: input.preferredLanguage, hotelId: input.hotelId }, options);
  const reset = interpreted.intent.action === "reset_exclusions";
  const excluded = new Set(reset ? [] : input.excludedOptionIds);
  if (!reset && interpreted.intent.rejectedHotelId) excluded.add(interpreted.intent.rejectedHotelId);
  const city = input.destination?.toLowerCase();
  const stays = demoCatalog.stays.filter((stay) => (!city || stay.city.toLowerCase() === city) && !excluded.has(stay.id));
  if (interpreted.intent.action === "cheaper") stays.sort((a, b) => a.nightlyAzn - b.nightlyAzn || a.id.localeCompare(b.id));
  else if (interpreted.intent.action === "more_luxurious") stays.sort((a, b) => b.locationScore - a.locationScore || b.nightlyAzn - a.nightlyAzn || a.id.localeCompare(b.id));
  else stays.sort((a, b) => b.locationScore - a.locationScore || a.id.localeCompare(b.id));
  const flights = interpreted.intent.preserveFlight && input.flightId
    ? demoCatalog.flights.filter((flight) => flight.id === input.flightId && !excluded.has(flight.id))
    : demoCatalog.flights.filter((flight) => (!city || flight.destination.toLowerCase() === city) && !excluded.has(flight.id));
  const error = stays.length === 0 ? "NO_ALTERNATIVES" as const : undefined;
  return { source: interpreted.source, model: interpreted.model, intent: interpreted.intent, excludedOptionIds: [...excluded], eligibleHotelIds: stays.map((stay) => stay.id), eligibleFlightIds: flights.map((flight) => flight.id), response: t(interpreted.intent.language, error ? "noAlternative" : "alternative"), error };
}
