import { buildInterpretation, detectLanguage, fallbackIntent, fallbackRegeneration } from "@/lib/agent/fallback";
import { regenerationIntentSchema, travelIntentSchema, type AgentInterpretation, type AgentLanguage, type RegenerationIntent } from "@/lib/agent/schemas";

const DEFAULT_MODEL = "gpt-4.1-mini";
const TIMEOUT_MS = 8_000;
type Fetcher = typeof fetch;

export type OpenAiFailureCode = "OPENAI_KEY_MISSING" | "OPENAI_AUTH_FAILED" | "OPENAI_QUOTA_EXCEEDED" | "OPENAI_MODEL_UNAVAILABLE" | "OPENAI_RATE_LIMITED" | "OPENAI_TIMEOUT" | "OPENAI_INVALID_JSON" | "OPENAI_SCHEMA_VALIDATION_FAILED" | "OPENAI_EMPTY_RESPONSE" | "OPENAI_PROVIDER_ERROR";
export interface OpenAiDiagnostic { code: OpenAiFailureCode; model: string; durationMs: number; retryCount: number; httpStatus?: number; validationIssuePaths?: string[]; }
export interface AgentRuntimeOptions { fetcher?: Fetcher; apiKey?: string; model?: string; baseUrl?: string; timeoutMs?: number; diagnosticLogger?: (diagnostic: OpenAiDiagnostic) => void; }
type Completion = { ok: true; value: unknown; model: string; durationMs: number; retryCount: number } | { ok: false; diagnostic: OpenAiDiagnostic };

const REQUIRED_ARRAYS = ["locationPreferences", "restaurantPreferences", "cuisinePreferences", "attractionPreferences", "transportPreferences", "accessibilityNeeds", "hardConstraints", "softPreferences", "specialRequests"] as const;
const SYSTEM = `You extract corporate and personal travel intent from Azerbaijani (including informal Latin text), Turkish, and English. Return one complete JSON object only. Never invent dates, cities, prices, coordinates, availability, Michelin recognition, or bookings. Distinguish explicit hard constraints from soft preferences. Resolve relative dates only when referenceTimestamp and timeZone are supplied; otherwise omit them. Language must be az, tr, or en. Keys must match: detectedLanguage,responseLanguage,languageConfidence,origin,destination,departureDate,returnDate,durationDays,travelerCount,totalBudget,currency,purpose,travelStyle,hotelStars,accommodationType,accommodationLevel,locationPreferences,restaurantPreferences,cuisinePreferences,attractionPreferences,transportPreferences,flightCabin,directFlightsOnly,accessibilityNeeds,hardConstraints,softPreferences,specialRequests,requiresMichelinVerification. Omit unknown optional scalar fields; always return every array field as an array and requiresMichelinVerification as a boolean.`;
const REGEN_SYSTEM = `Classify a travel-plan modification in Azerbaijani, Turkish, or English. Return one complete JSON object only with keys language,action,preserveFlight,rejectedHotelId,addedHardConstraints,addedSoftPreferences. action is one of replace_hotel,cheaper,more_luxurious,keep_flight_change_hotel,change_restaurants,closer_to_center,reset_exclusions. Preserve unchanged constraints.`;

function emit(options: AgentRuntimeOptions, diagnostic: OpenAiDiagnostic): void {
  if (options.diagnosticLogger) options.diagnosticLogger(diagnostic);
  else console.warn(`[atlasflow-agent] ${JSON.stringify(diagnostic)}`);
}

function classifyProvider(status: number, providerCode?: string): OpenAiFailureCode {
  if (status === 401 || status === 403) return "OPENAI_AUTH_FAILED";
  if (status === 429) return providerCode === "insufficient_quota" ? "OPENAI_QUOTA_EXCEEDED" : "OPENAI_RATE_LIMITED";
  if (status === 404 || providerCode === "model_not_found") return "OPENAI_MODEL_UNAVAILABLE";
  return "OPENAI_PROVIDER_ERROR";
}

async function providerErrorCode(response: Response): Promise<string | undefined> {
  try { return ((await response.json()) as { error?: { code?: string } }).error?.code; }
  catch { return undefined; }
}

async function completeJson(system: string, input: unknown, options: AgentRuntimeOptions): Promise<Completion> {
  const started = Date.now();
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  if (!apiKey) return { ok: false, diagnostic: { code: "OPENAI_KEY_MISSING", model, durationMs: Date.now() - started, retryCount: 0 } };
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
      if (!response.ok) {
        const providerCode = await providerErrorCode(response);
        if (response.status >= 500 && attempt === 0) continue;
        return { ok: false, diagnostic: { code: classifyProvider(response.status, providerCode), model, httpStatus: response.status, durationMs: Date.now() - started, retryCount: attempt } };
      }
      let body: { choices?: Array<{ finish_reason?: string; message?: { content?: string } }> };
      try { body = await response.json() as typeof body; }
      catch { return { ok: false, diagnostic: { code: "OPENAI_INVALID_JSON", model, httpStatus: response.status, durationMs: Date.now() - started, retryCount: attempt } }; }
      const choice = body.choices?.[0];
      const content = choice?.message?.content;
      if (!content) return { ok: false, diagnostic: { code: "OPENAI_EMPTY_RESPONSE", model, httpStatus: response.status, durationMs: Date.now() - started, retryCount: attempt } };
      if (choice.finish_reason === "length") return { ok: false, diagnostic: { code: "OPENAI_INVALID_JSON", model, httpStatus: response.status, durationMs: Date.now() - started, retryCount: attempt } };
      try { return { ok: true, value: JSON.parse(content) as unknown, model, durationMs: Date.now() - started, retryCount: attempt }; }
      catch { return { ok: false, diagnostic: { code: "OPENAI_INVALID_JSON", model, httpStatus: response.status, durationMs: Date.now() - started, retryCount: attempt } }; }
    } catch (error) {
      const timeoutFailure = error instanceof DOMException && error.name === "AbortError";
      if (attempt === 0) continue;
      return { ok: false, diagnostic: { code: timeoutFailure ? "OPENAI_TIMEOUT" : "OPENAI_PROVIDER_ERROR", model, durationMs: Date.now() - started, retryCount: attempt } };
    } finally { clearTimeout(timeout); }
  }
  return { ok: false, diagnostic: { code: "OPENAI_PROVIDER_ERROR", model, durationMs: Date.now() - started, retryCount: 1 } };
}

type InterpretInput = { message: string; preferredLanguage?: AgentLanguage; savedPreferences?: unknown; companyPolicy?: unknown; referenceTimestamp?: string; timeZone?: string };

function normalizeIntent(value: unknown, input: InterpretInput): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const raw = Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null));
  const detected = detectLanguage(input.message);
  for (const field of REQUIRED_ARRAYS) if (raw[field] === undefined) raw[field] = [];
  if (raw.requiresMichelinVerification === undefined) raw.requiresMichelinVerification = false;
  if (raw.detectedLanguage === undefined) raw.detectedLanguage = detected.language;
  if (raw.responseLanguage === undefined) raw.responseLanguage = input.preferredLanguage ?? raw.detectedLanguage;
  if (raw.languageConfidence === undefined) raw.languageConfidence = detected.confidence;
  return { ...raw, originalMessage: input.message, responseLanguage: input.preferredLanguage ?? raw.responseLanguage };
}

export async function interpretAgentRequest(input: InterpretInput, options: AgentRuntimeOptions = {}): Promise<AgentInterpretation> {
  const completion = await completeJson(SYSTEM, input, options);
  if (completion.ok) {
    const parsed = travelIntentSchema.safeParse(normalizeIntent(completion.value, input));
    if (parsed.success) return buildInterpretation(parsed.data, "openai", completion.model);
    emit(options, { code: "OPENAI_SCHEMA_VALIDATION_FAILED", model: completion.model, durationMs: completion.durationMs, retryCount: completion.retryCount, validationIssuePaths: [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "root"))].slice(0, 20) });
  } else emit(options, completion.diagnostic);
  return buildInterpretation(fallbackIntent(input.message, input.preferredLanguage, { referenceTimestamp: input.referenceTimestamp, timeZone: input.timeZone }), "fallback");
}

export async function interpretRegeneration(input: { instruction: string; preferredLanguage?: AgentLanguage; hotelId?: string }, options: AgentRuntimeOptions = {}): Promise<{ intent: RegenerationIntent; source: "openai" | "fallback"; model?: string }> {
  const completion = await completeJson(REGEN_SYSTEM, input, options);
  if (completion.ok) {
    const raw = completion.value && typeof completion.value === "object" && !Array.isArray(completion.value) ? completion.value as Record<string, unknown> : {};
    const parsed = regenerationIntentSchema.safeParse({ addedHardConstraints: [], addedSoftPreferences: [], ...raw, language: input.preferredLanguage ?? raw.language, rejectedHotelId: raw.rejectedHotelId ?? input.hotelId });
    if (parsed.success) return { intent: parsed.data, source: "openai", model: completion.model };
    emit(options, { code: "OPENAI_SCHEMA_VALIDATION_FAILED", model: completion.model, durationMs: completion.durationMs, retryCount: completion.retryCount, validationIssuePaths: [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "root"))].slice(0, 20) });
  } else emit(options, completion.diagnostic);
  return { intent: fallbackRegeneration(input.instruction, input.preferredLanguage, input.hotelId), source: "fallback" };
}

export const openAiAgentDefaults = { model: DEFAULT_MODEL, timeoutMs: TIMEOUT_MS, retries: 1, maxOutputTokens: 900 } as const;
