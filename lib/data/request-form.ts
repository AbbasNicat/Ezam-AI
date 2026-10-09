import { z } from "zod";
import { cityProfile, demoCatalog } from "@/lib/data/catalog";
import type { RequestFormValues } from "@/lib/data/demo-scenario";
import { DEMO_REQUEST_ID } from "@/lib/data/demo-scenario";
import {
  ACCOMMODATION_PREFERENCES,
  CABINS,
  CURRENCIES,
  LEVELS,
  type TravelRequest,
} from "@/types/travel";

export const INTEREST_OPTIONS = ["museums", "architecture", "history", "food", "shopping", "nature"] as const;

export const requestFormSchema = z
  .object({
    employeeName: z.string().min(2, "Enter the employee name."),
    companyName: z.string().min(2, "Enter the company name."),
    origin: z.string().min(2, "Enter an origin city."),
    destination: z.string().min(2, "Enter a destination city."),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a departure date."),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a return date."),
    travelerCount: z.number().int().min(1).max(8),
    corporateBudget: z.number().nonnegative(),
    currency: z.enum(CURRENCIES),
    purpose: z.string().min(3, "Describe the business purpose."),
    meetingTitle: z.string(),
    meetingDate: z.string(),
    meetingStart: z.string(),
    meetingEnd: z.string(),
    cabinPreference: z.enum(CABINS),
    accommodationPreference: z.enum(ACCOMMODATION_PREFERENCES),
    accommodationLevel: z.enum(LEVELS),
    leisureEnabled: z.boolean(),
    personalLeisureBudget: z.number().nonnegative(),
    interests: z.array(z.string()),
    specialRequirements: z.string(),
    freeText: z.string(),
  })
  .refine((value) => value.returnDate >= value.departureDate, {
    path: ["returnDate"],
    message: "Return date must be on or after departure.",
  });

export function requestFromForm(values: RequestFormValues): TravelRequest {
  const city = cityProfile(demoCatalog, values.destination);
  const meetings =
    values.meetingDate && values.meetingStart && values.meetingEnd
      ? [
          {
            title: values.meetingTitle || "Business meeting",
            date: values.meetingDate,
            startTime: values.meetingStart,
            endTime: values.meetingEnd,
            locationName: city?.meeting.name ?? `${values.destination} meeting`,
            lat: city?.meeting.lat ?? 0,
            lng: city?.meeting.lng ?? 0,
          },
        ]
      : [];
  const demo =
    values.employeeName === "Aylin M." &&
    values.destination.toLowerCase() === "istanbul" &&
    values.companyName === "Caspian Ventures";
  return {
    id: demo ? DEMO_REQUEST_ID : `trip-${values.employeeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${values.departureDate}`,
    employeeName: values.employeeName,
    companyName: values.companyName,
    origin: values.origin,
    destination: values.destination,
    departureDate: values.departureDate,
    returnDate: values.returnDate,
    travelerCount: values.travelerCount,
    corporateBudget: values.corporateBudget,
    currency: values.currency,
    purpose: values.purpose,
    meetings,
    cabinPreference: values.cabinPreference,
    accommodationPreference: values.accommodationPreference,
    accommodationLevel: values.accommodationLevel,
    leisureEnabled: values.leisureEnabled,
    personalLeisureBudget: values.personalLeisureBudget,
    interests: values.interests,
    specialRequirements: values.specialRequirements,
  };
}
