import { parsedTravelSchema, type ParsedTravel, SUPPORTED_DESTINATIONS } from "@/lib/ai/schemas";
import { titleCaseCity } from "@/lib/utils";
import type { PlanResult, TravelRequest } from "@/types/travel";

const INTERESTS = ["museums", "architecture", "history", "food", "shopping", "nature"] as const;

export interface Interpretation {
  mode: "basic" | "ai";
  usedModel: boolean;
  parsed: ParsedTravel;
  rejectedClaims: string[];
}

export function acceptModelPayload(raw: unknown): ParsedTravel | null {
  const parsed = parsedTravelSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function deterministicParse(text: string, context: Partial<TravelRequest> = {}): ParsedTravel {
  const source = text.trim();
  const notes: string[] = [];
  const missing: string[] = [];
  const budgetMatch = source.match(/(\d+(?:[.,]\d+)?)\s*(AZN|USD|EUR|TRY|GEL|AED)/i);
  const corporateBudget = budgetMatch
    ? Number(budgetMatch[1]?.replace(",", "."))
    : context.corporateBudget;
  const currency = budgetMatch
    ? (budgetMatch[2]?.toUpperCase() as ParsedTravel["currency"])
    : context.currency;

  const destination = SUPPORTED_DESTINATIONS.find((city) =>
    new RegExp(`\\b${city}\\b`, "i").test(source),
  );
  const origin = /\bBaku\b/i.test(source) ? "Baku" : undefined;
  let cabinPreference: ParsedTravel["cabinPreference"];
  if (/premium economy/i.test(source)) cabinPreference = "premium_economy";
  else if (/business/i.test(source)) cabinPreference = "business";
  else if (/first class/i.test(source)) cabinPreference = "first";
  else if (/economy/i.test(source)) cabinPreference = "economy";

  let accommodationPreference: ParsedTravel["accommodationPreference"];
  if (/apartment/i.test(source)) accommodationPreference = "apartment";
  else if (/hotel/i.test(source)) accommodationPreference = "hotel";

  const interests = INTERESTS.filter((interest) => new RegExp(interest, "i").test(source));
  const quietStay = /quiet/i.test(source);
  const purpose = /client meeting/i.test(source)
    ? "Client meeting"
    : /conference/i.test(source)
      ? "Conference"
      : context.purpose;

  if (!destination && !context.destination) missing.push("destination");
  if (!budgetMatch && context.corporateBudget === undefined) missing.push("corporate budget");
  if (!/\b20\d{2}-\d{2}-\d{2}\b/.test(source) && !context.departureDate) missing.push("dates");
  if (quietStay) notes.push("Quiet accommodation was inferred from the request text.");
  if (interests.length > 0) notes.push(`Leisure interests inferred: ${interests.join(", ")}.`);
  notes.push("Basic planning mode used deterministic text rules. No live fares were inferred.");

  return {
    origin,
    destination,
    corporateBudget,
    currency,
    purpose,
    cabinPreference,
    accommodationPreference,
    accommodationLevel: quietStay ? "standard" : undefined,
    quietStay,
    interests,
    leisureEnabled: interests.length > 0 ? true : undefined,
    missingInformation: missing,
    notes,
  };
}

export function sanitizeParsed(parsed: ParsedTravel): { parsed: ParsedTravel; rejectedClaims: string[] } {
  const rejectedClaims: string[] = [];
  let destination = parsed.destination;
  if (destination && !SUPPORTED_DESTINATIONS.some((city) => city.toLowerCase() === destination!.toLowerCase())) {
    rejectedClaims.push(`Unsupported destination claim "${destination}" was discarded.`);
    destination = undefined;
  } else if (destination) {
    destination = titleCaseCity(destination);
  }
  return {
    parsed: {
      ...parsed,
      destination,
      missingInformation: parsed.missingInformation ?? [],
      notes: [...(parsed.notes ?? []), ...rejectedClaims],
    },
    rejectedClaims,
  };
}

export function interpretTravelText(input: {
  text: string;
  context?: Partial<TravelRequest>;
  modelPayload?: unknown;
}): Interpretation {
  const model = input.modelPayload === undefined ? null : acceptModelPayload(input.modelPayload);
  if (input.modelPayload !== undefined && !model) {
    const parsed = deterministicParse(input.text, input.context);
    return {
      mode: "basic",
      usedModel: false,
      parsed: {
        ...parsed,
        notes: [
          ...parsed.notes,
          "The model payload failed schema validation and was discarded.",
        ],
      },
      rejectedClaims: ["Malformed model payload."],
    };
  }
  if (model) {
    const clean = sanitizeParsed(model);
    return { mode: "ai", usedModel: true, parsed: clean.parsed, rejectedClaims: clean.rejectedClaims };
  }
  return {
    mode: "basic",
    usedModel: false,
    parsed: deterministicParse(input.text, input.context),
    rejectedClaims: [],
  };
}

export function explainTravelPlan(plan: PlanResult): string {
  if (plan.status !== "ok") {
    return plan.suggestedFixes.join(" ");
  }
  return plan.packages.map((pkg) => pkg.explanation).join("\n\n");
}

export function suggestTripAdjustments(plan: PlanResult): string[] {
  if (plan.suggestedFixes.length > 0) return plan.suggestedFixes;
  return plan.packages.flatMap((pkg) => pkg.policyEvaluation.suggestedFixes);
}
