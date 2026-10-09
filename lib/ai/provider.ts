import { explainTravelPlan, interpretTravelText, suggestTripAdjustments } from "@/lib/ai/fallback";
import { EXPLAIN_SYSTEM_PROMPT, PARSE_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { Interpretation } from "@/lib/ai/fallback";
import type { PlanResult, TravelRequest } from "@/types/travel";

function runtimeConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY && process.env.LLM_MODEL);
}

async function complete(system: string, user: string): Promise<unknown | null> {
  if (!runtimeConfigured()) return null;
  const base = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!response.ok) {
      console.error("AtlasFlow LLM request failed", response.status);
      return null;
    }
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as unknown;
  } catch (error) {
    console.error("AtlasFlow LLM request threw", error);
    return null;
  }
}

export async function parseTravelRequest(
  text: string,
  context: Partial<TravelRequest> = {},
): Promise<Interpretation> {
  if (!runtimeConfigured()) {
    return interpretTravelText({ text, context });
  }
  const payload = await complete(
    PARSE_SYSTEM_PROMPT,
    JSON.stringify({ text, context, schema: "ParsedTravel" }),
  );
  if (!payload) return interpretTravelText({ text, context });
  return interpretTravelText({ text, context, modelPayload: payload });
}

export async function explainPlan(plan: PlanResult): Promise<{ mode: "basic" | "ai"; text: string }> {
  const fallback = explainTravelPlan(plan);
  if (!runtimeConfigured()) return { mode: "basic", text: fallback };
  const payload = await complete(EXPLAIN_SYSTEM_PROMPT, JSON.stringify({ fallback, status: plan.status }));
  if (!payload || typeof payload !== "object" || !("text" in payload) || typeof payload.text !== "string") {
    return { mode: "basic", text: fallback };
  }
  return { mode: "ai", text: payload.text };
}

export async function suggestAdjustments(plan: PlanResult): Promise<string[]> {
  const fallback = suggestTripAdjustments(plan);
  if (!runtimeConfigured()) return fallback;
  const payload = await complete(
    EXPLAIN_SYSTEM_PROMPT,
    JSON.stringify({ task: "suggest adjustments", fallback }),
  );
  if (
    !payload ||
    typeof payload !== "object" ||
    !("suggestions" in payload) ||
    !Array.isArray(payload.suggestions)
  ) {
    return fallback;
  }
  const suggestions = payload.suggestions.filter((item): item is string => typeof item === "string");
  return suggestions.length > 0 ? suggestions : fallback;
}
