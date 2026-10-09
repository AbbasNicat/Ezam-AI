import type { TravelRequest } from "@/types/travel";
import { cityProfile, demoCatalog } from "@/lib/data/catalog";

export const DEMO_REQUEST_ID = "trip-caspian-aylin-ist";

export const DEMO_FREE_TEXT =
  "I have a client meeting in Istanbul. I need to travel from Baku for three days. Budget is 1800 AZN. Economy flight. A quiet hotel near the center. I'd also like to see museums after work.";

const istanbulMeeting = cityProfile(demoCatalog, "Istanbul")!.meeting;

export const demoRequest: TravelRequest = {
  id: DEMO_REQUEST_ID,
  employeeName: "Aylin M.",
  companyName: "Caspian Ventures",
  origin: "Baku",
  destination: "Istanbul",
  departureDate: "2026-10-20",
  returnDate: "2026-10-22",
  travelerCount: 1,
  corporateBudget: 1800,
  currency: "AZN",
  purpose: "Client meeting",
  meetings: [
    {
      title: "Client meeting",
      date: "2026-10-21",
      startTime: "10:00",
      endTime: "12:30",
      locationName: istanbulMeeting.name,
      lat: istanbulMeeting.lat,
      lng: istanbulMeeting.lng,
    },
  ],
  cabinPreference: "economy",
  accommodationPreference: "either",
  accommodationLevel: "standard",
  leisureEnabled: true,
  personalLeisureBudget: 200,
  interests: ["museums", "architecture"],
  specialRequirements: "Quiet hotel. Visit museums after the meeting.",
};

export interface RequestFormValues {
  employeeName: string;
  companyName: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
  corporateBudget: number;
  currency: TravelRequest["currency"];
  purpose: string;
  meetingTitle: string;
  meetingDate: string;
  meetingStart: string;
  meetingEnd: string;
  cabinPreference: TravelRequest["cabinPreference"];
  accommodationPreference: TravelRequest["accommodationPreference"];
  accommodationLevel: TravelRequest["accommodationLevel"];
  leisureEnabled: boolean;
  personalLeisureBudget: number;
  interests: string[];
  specialRequirements: string;
  freeText: string;
}

export const emptyFormValues: RequestFormValues = {
  employeeName: "",
  companyName: "Caspian Ventures",
  origin: "Baku",
  destination: "Istanbul",
  departureDate: "2026-10-20",
  returnDate: "2026-10-22",
  travelerCount: 1,
  corporateBudget: 1800,
  currency: "AZN",
  purpose: "Client meeting",
  meetingTitle: "",
  meetingDate: "",
  meetingStart: "10:00",
  meetingEnd: "12:30",
  cabinPreference: "economy",
  accommodationPreference: "either",
  accommodationLevel: "standard",
  leisureEnabled: false,
  personalLeisureBudget: 0,
  interests: [],
  specialRequirements: "",
  freeText: "",
};

export const demoFormValues: RequestFormValues = {
  employeeName: demoRequest.employeeName,
  companyName: demoRequest.companyName,
  origin: demoRequest.origin,
  destination: demoRequest.destination,
  departureDate: demoRequest.departureDate,
  returnDate: demoRequest.returnDate,
  travelerCount: demoRequest.travelerCount,
  corporateBudget: demoRequest.corporateBudget,
  currency: demoRequest.currency,
  purpose: demoRequest.purpose,
  meetingTitle: demoRequest.meetings[0]?.title ?? "Client meeting",
  meetingDate: demoRequest.meetings[0]?.date ?? "",
  meetingStart: demoRequest.meetings[0]?.startTime ?? "10:00",
  meetingEnd: demoRequest.meetings[0]?.endTime ?? "12:30",
  cabinPreference: demoRequest.cabinPreference,
  accommodationPreference: demoRequest.accommodationPreference,
  accommodationLevel: demoRequest.accommodationLevel,
  leisureEnabled: demoRequest.leisureEnabled,
  personalLeisureBudget: demoRequest.personalLeisureBudget,
  interests: [...demoRequest.interests],
  specialRequirements: demoRequest.specialRequirements,
  freeText: DEMO_FREE_TEXT,
};
