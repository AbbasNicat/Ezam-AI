import { buildInterpretation, fallbackIntent, fallbackRegeneration } from "@/lib/agent/fallback";
import { regenerationIntentSchema, travelIntentSchema, type AgentInterpretation, type AgentLanguage, type RegenerationIntent } from "@/lib/agent/schemas";

const DEFAULT_MODEL = "gpt-4.1-mini";
const TIMEOUT_MS = 8_000;
type Fetcher = typeof fetch;
export interface AgentRuntimeOptions { fetcher?: Fetcher; apiKey?: string; model?: string; baseUrl?: string; timeoutMs?: number; }

const SYSTEM = `You extract corporate and personal travel intent from Azerbaijani (including informal Latin text), Turkish, and English. Return JSON only. Never invent dates, cities, prices, coordinates, availability, Michelin recognition, or bookings. Distinguish explicit hard constraints from soft preferences. Use ISO dates only when explicitly supplied. Language must be az, tr, or en. Keys must match: detectedLanguage,responseLanguage,languageConfidence,origin,destination,departureDate,returnDate,durationDays,travelerCount,totalBudget,currency,purpose,travelStyle,hotelStars,accommodationType,accommodationLevel,locationPreferences,restaurantPreferences,cuisinePreferences,attractionPreferences,transportPreferences,flightCabin,directFlightsOnly,accessibilityNeeds,hardConstraints,softPreferences,specialRequests,requiresMichelinVerification. Omit unknown optional scalar fields; use arrays for list fields.`;

async function completeJson(system: string, input: unknown, options: AgentRuntimeOptions): Promise<{ value: unknown; model: string } | null> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const baseUrl = (options.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const fetcher = options.fetcher ?? fetch;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? TIMEOUT_MS);
    try {
      const response = await fetcher(`${baseUrl}/chat/completions`, {
        method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, temperature: 0, max_tokens: 900, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(input) }] }),
      });
      if (!response.ok) { if (response.status >= 500 && attempt === 0) continue; return null; }
      const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = body.choices?.[0]?.message?.content;
      if (!content) return null;
      return { value: JSON.parse(content) as unknown, model };
    } catch { if (attempt === 1) return null; }
    finally { clearTimeout(timeout); }
  }
  return null;
}

export async function interpretAgentRequest(input: { message: string; preferredLanguage?: AgentLanguage; savedPreferences?: unknown; companyPolicy?: unknown }, options: AgentRuntimeOptions = {}): Promise<AgentInterpretation> {
  const completion = await completeJson(SYSTEM, input, options);
  if (completion) {
    const parsed = travelIntentSchema.safeParse({ ...(completion.value as object), originalMessage: input.message, responseLanguage: input.preferredLanguage ?? (completion.value as { detectedLanguage?: string }).detectedLanguage });
    if (parsed.success) return buildInterpretation(parsed.data, "openai", completion.model);
  }
  return buildInterpretation(fallbackIntent(input.message, input.preferredLanguage), "fallback");
}

const REGEN_SYSTEM = `Classify a travel-plan modification in Azerbaijani, Turkish, or English. JSON only with keys language,action,preserveFlight,rejectedHotelId,addedHardConstraints,addedSoftPreferences. action is one of replace_hotel,cheaper,more_luxurious,keep_flight_change_hotel,change_restaurants,closer_to_center,reset_exclusions. Preserve unchanged constraints.`;

export async function interpretRegeneration(input: { instruction: string; preferredLanguage?: AgentLanguage; hotelId?: string }, options: AgentRuntimeOptions = {}): Promise<{ intent: RegenerationIntent; source: "openai" | "fallback"; model?: string }> {
  const completion = await completeJson(REGEN_SYSTEM, input, options);
  if (completion) {
    const parsed = regenerationIntentSchema.safeParse({ ...(completion.value as object), language: input.preferredLanguage ?? (completion.value as { language?: string }).language, rejectedHotelId: (completion.value as { rejectedHotelId?: string }).rejectedHotelId ?? input.hotelId });
    if (parsed.success) return { intent: parsed.data, source: "openai", model: completion.model };
  }
  return { intent: fallbackRegeneration(input.instruction, input.preferredLanguage, input.hotelId), source: "fallback" };
}

export const openAiAgentDefaults = { model: DEFAULT_MODEL, timeoutMs: TIMEOUT_MS, retries: 1, maxOutputTokens: 900 } as const;
