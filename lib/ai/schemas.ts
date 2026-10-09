import { z } from "zod";
import { ACCOMMODATION_PREFERENCES, CABINS, CURRENCIES, LEVELS } from "@/types/travel";

export const parsedTravelSchema = z.object({
  origin: z.string().min(2).optional(),
  destination: z.string().min(2).optional(),
  corporateBudget: z.number().positive().optional(),
  currency: z.enum(CURRENCIES).optional(),
  purpose: z.string().min(2).optional(),
  cabinPreference: z.enum(CABINS).optional(),
  accommodationPreference: z.enum(ACCOMMODATION_PREFERENCES).optional(),
  accommodationLevel: z.enum(LEVELS).optional(),
  quietStay: z.boolean().optional(),
  interests: z.array(z.string()).optional(),
  leisureEnabled: z.boolean().optional(),
  personalLeisureBudget: z.number().nonnegative().optional(),
  missingInformation: z.array(z.string()),
  notes: z.array(z.string()),
});

export type ParsedTravel = z.infer<typeof parsedTravelSchema>;

export const SUPPORTED_DESTINATIONS = ["Istanbul", "Tbilisi", "Dubai"] as const;
export const KNOWN_ORIGINS = ["Baku"] as const;
