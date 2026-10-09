import { z } from "zod";
import { ACCOMMODATION_PREFERENCES, CABINS, CURRENCIES, LEVELS } from "@/types/travel";

export const agentLanguages = ["az", "tr", "en"] as const;
export const agentLanguageSchema = z.enum(agentLanguages);
export type AgentLanguage = z.infer<typeof agentLanguageSchema>;

const constraintSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["equals", "maximum", "minimum", "required", "excluded"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
  reason: z.string().min(1),
});

export const travelIntentSchema = z.object({
  originalMessage: z.string().min(1).max(4000), detectedLanguage: agentLanguageSchema,
  responseLanguage: agentLanguageSchema, languageConfidence: z.number().min(0).max(1),
  origin: z.string().min(2).optional(), destination: z.string().min(2).optional(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  durationDays: z.number().int().positive().max(60).optional(), travelerCount: z.number().int().positive().max(8).optional(),
  totalBudget: z.number().positive().optional(), currency: z.enum(CURRENCIES).optional(), purpose: z.string().min(2).optional(),
  travelStyle: z.enum(["value", "balanced", "luxury"]).optional(), hotelStars: z.number().int().min(1).max(5).optional(),
  accommodationType: z.enum(ACCOMMODATION_PREFERENCES).optional(), accommodationLevel: z.enum(LEVELS).optional(),
  locationPreferences: z.array(z.string().min(1)).max(12).default([]), restaurantPreferences: z.array(z.string().min(1)).max(12).default([]),
  cuisinePreferences: z.array(z.string().min(1)).max(12).default([]), attractionPreferences: z.array(z.string().min(1)).max(12).default([]),
  transportPreferences: z.array(z.string().min(1)).max(12).default([]), flightCabin: z.enum(CABINS).optional(), directFlightsOnly: z.boolean().optional(),
  accessibilityNeeds: z.array(z.string().min(1)).max(8).default([]), hardConstraints: z.array(constraintSchema).max(20).default([]),
  softPreferences: z.array(z.string().min(1)).max(20).default([]), specialRequests: z.array(z.string().min(1)).max(20).default([]),
  requiresMichelinVerification: z.boolean().default(false),
});
export type TravelIntent = z.infer<typeof travelIntentSchema>;

export const interpretRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000), preferredLanguage: agentLanguageSchema.optional(),
  savedPreferences: z.record(z.string(), z.unknown()).optional(), companyPolicy: z.record(z.string(), z.unknown()).optional(),
  referenceTimestamp: z.string().datetime({ offset: true }).optional(), timeZone: z.string().min(1).max(100).optional(),
});

export const agentInterpretationSchema = z.object({
  source: z.enum(["openai", "fallback"]), model: z.string().optional(), intent: travelIntentSchema,
  plannerInput: z.object({
    origin: z.string().optional(), destination: z.string().optional(), departureDate: z.string().optional(), returnDate: z.string().optional(),
    travelerCount: z.number().optional(), corporateBudget: z.number().optional(), currency: z.enum(CURRENCIES).optional(), purpose: z.string().optional(),
    cabinPreference: z.enum(CABINS).optional(), accommodationPreference: z.enum(ACCOMMODATION_PREFERENCES).optional(),
    accommodationLevel: z.enum(LEVELS).optional(), leisureEnabled: z.boolean().optional(), interests: z.array(z.string()).optional(), specialRequirements: z.string().optional(),
  }),
  clarificationQuestions: z.array(z.string()), warnings: z.array(z.string()), response: z.string(),
});
export type AgentInterpretation = z.infer<typeof agentInterpretationSchema>;

export const regenerationActions = ["replace_hotel", "cheaper", "more_luxurious", "keep_flight_change_hotel", "change_restaurants", "closer_to_center", "reset_exclusions"] as const;
export const regenerationIntentSchema = z.object({
  language: agentLanguageSchema, action: z.enum(regenerationActions), preserveFlight: z.boolean(), rejectedHotelId: z.string().optional(),
  addedHardConstraints: z.array(constraintSchema).default([]), addedSoftPreferences: z.array(z.string()).default([]),
});
export type RegenerationIntent = z.infer<typeof regenerationIntentSchema>;

export const regenerateRequestSchema = z.object({
  instruction: z.string().trim().min(1).max(2000), preferredLanguage: agentLanguageSchema.optional(), currentRequest: z.record(z.string(), z.unknown()),
  selectedPackage: z.object({ flightId: z.string().optional(), hotelId: z.string().optional() }), excludedOptionIds: z.array(z.string()).max(100).default([]),
});
export interface RegenerationResult { source: "openai" | "fallback"; model?: string; intent: RegenerationIntent; excludedOptionIds: string[]; eligibleHotelIds: string[]; eligibleFlightIds: string[]; response: string; error?: "NO_ALTERNATIVES"; }
