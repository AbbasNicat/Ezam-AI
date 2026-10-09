import { cityProfile } from "@/lib/data/catalog";
import { formatMinutes, listDates, minutesOf, rangesOverlap } from "@/lib/utils/dates";
import { haversineKm } from "@/lib/utils/geo";
import { majorToAznCents } from "@/lib/utils/money";
import type {
  AttractionItem,
  Catalog,
  FlightItem,
  ItineraryStop,
  Meeting,
  StayItem,
  TravelRequest,
} from "@/types/travel";

export interface ScheduledAttraction {
  attraction: AttractionItem;
  day: string;
  startTime: string;
  endTime: string;
}

const LEISURE_SLOTS = [
  { start: 13 * 60 + 30, minutes: 90 },
  { start: 16 * 60, minutes: 90 },
  { start: 18 * 60 + 30, minutes: 75 },
];

function blocksForDay(
  day: string,
  index: number,
  dateCount: number,
  flight: FlightItem,
  meetings: Meeting[],
): Array<{ start: number; end: number }> {
  const blocks: Array<{ start: number; end: number }> = [];
  if (index === 0) {
    const arrive = minutesOf(flight.departTime) + flight.durationMinutes + 90;
    blocks.push({ start: 0, end: Math.min(arrive, 24 * 60) });
  }
  if (index === dateCount - 1) {
    const departForAirport = minutesOf(flight.returnTime) - 180;
    blocks.push({ start: Math.max(0, departForAirport), end: 24 * 60 });
  }
  for (const meeting of meetings) {
    if (meeting.date !== day) continue;
    blocks.push({
      start: Math.max(0, minutesOf(meeting.startTime) - 60),
      end: Math.min(24 * 60, minutesOf(meeting.endTime) + 60),
    });
  }
  return blocks;
}

export function scheduleAttractions(input: {
  request: TravelRequest;
  flight: FlightItem;
  stay: StayItem | null;
  catalog: Catalog;
}): ScheduledAttraction[] {
  const { request, flight, stay, catalog } = input;
  if (!request.leisureEnabled) return [];
  const dates = listDates(request.departureDate, request.returnDate);
  const interests = request.interests.map((item) => item.toLowerCase());
  const ranked = catalog.attractions
    .filter((item) => item.city.toLowerCase() === request.destination.trim().toLowerCase())
    .map((attraction) => {
      const tags = attraction.interests.map((item) => item.toLowerCase());
      const match = interests.filter((interest) => tags.includes(interest)).length;
      const dist = stay ? haversineKm(stay, attraction) : 0;
      return { attraction, match, dist };
    })
    .filter((item) => (interests.length === 0 ? true : item.match > 0))
    .sort(
      (a, b) =>
        b.match - a.match ||
        a.dist - b.dist ||
        a.attraction.id.localeCompare(b.attraction.id),
    );

  const budgetCents = majorToAznCents(request.personalLeisureBudget, request.currency);
  let spent = 0;
  const affordable: AttractionItem[] = [];
  for (const item of ranked) {
    const cost = Math.round(item.attraction.admissionAzn * 100);
    if (spent + cost > budgetCents) continue;
    affordable.push(item.attraction);
    spent += cost;
  }

  const scheduled: ScheduledAttraction[] = [];
  let cursor = 0;
  for (let index = 0; index < dates.length; index += 1) {
    const day = dates[index]!;
    const blocks = blocksForDay(day, index, dates.length, flight, request.meetings);
    for (const slot of LEISURE_SLOTS) {
      if (cursor >= affordable.length) return scheduled;
      const end = slot.start + slot.minutes;
      const blocked = blocks.some((block) =>
        rangesOverlap(slot.start, end, block.start, block.end),
      );
      if (blocked) continue;
      const attraction = affordable[cursor]!;
      cursor += 1;
      scheduled.push({
        attraction,
        day,
        startTime: formatMinutes(slot.start),
        endTime: formatMinutes(slot.start + attraction.durationMinutes),
      });
    }
  }
  return scheduled;
}

export function buildItinerary(input: {
  request: TravelRequest;
  flight: FlightItem;
  stay: StayItem | null;
  catalog: Catalog;
  attractions: ScheduledAttraction[];
}): ItineraryStop[] {
  const { request, flight, stay, catalog, attractions } = input;
  const dates = listDates(request.departureDate, request.returnDate);
  const city = cityProfile(catalog, request.destination);
  const stops: ItineraryStop[] = [];

  dates.forEach((day, index) => {
    if (index === 0) {
      const arrive = minutesOf(flight.departTime) + flight.durationMinutes;
      stops.push({
        id: `${day}-depart`,
        day,
        startTime: flight.departTime,
        endTime: formatMinutes(arrive),
        title: flight.name,
        category: "flight",
        notes: "Demo fare estimate — not live availability. Departs Baku (GYD).",
        payer: "corporate",
        currency: request.currency,
      });
      stops.push({
        id: `${day}-arrive`,
        day,
        startTime: formatMinutes(arrive),
        endTime: formatMinutes(arrive + 40),
        title: `Arrive ${flight.airportName}`,
        category: "flight",
        location: {
          lat: flight.airportLat,
          lng: flight.airportLng,
          label: flight.airportName,
        },
        notes: "Map line is an itinerary visualization, not a verified road route.",
      });
      stops.push({
        id: `${day}-transfer`,
        day,
        startTime: formatMinutes(arrive + 40),
        endTime: formatMinutes(arrive + 100),
        title: stay ? `Transfer to ${stay.name}` : "Ground transfer",
        category: "transport",
        payer: "corporate",
        notes: "Included in the daily ground-transport estimate.",
      });
      if (stay) {
        stops.push({
          id: `${day}-checkin`,
          day,
          startTime: formatMinutes(arrive + 100),
          endTime: formatMinutes(arrive + 130),
          title: `Check in · ${stay.name}`,
          category: "hotel",
          location: { lat: stay.lat, lng: stay.lng, label: stay.name },
          notes: `${stay.neighborhood}. Demo nightly estimate ${stay.nightlyAzn} AZN.`,
          payer: "corporate",
        });
      }
    }

    for (const meeting of request.meetings.filter((item) => item.date === day)) {
      stops.push({
        id: `${day}-meeting-${meeting.startTime}`,
        day,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        title: meeting.title,
        category: "meeting",
        location: { lat: meeting.lat, lng: meeting.lng, label: meeting.locationName },
        notes: meeting.locationName,
        payer: "corporate",
      });
    }

    if (index > 0 && index < dates.length - 1) {
      stops.push({
        id: `${day}-meals`,
        day,
        startTime: "08:00",
        endTime: "08:45",
        title: "Business meals within allowance",
        category: "meal",
        payer: "corporate",
        notes: city
          ? `City meal estimate ${city.mealDailyAzn} AZN, capped by the company allowance.`
          : "Estimated meal allowance.",
      });
    }

    if (index === dates.length - 1) {
      if (stay && dates.length > 1) {
        stops.push({
          id: `${day}-checkout`,
          day,
          startTime: "08:00",
          endTime: "08:40",
          title: `Check out · ${stay.name}`,
          category: "hotel",
          location: { lat: stay.lat, lng: stay.lng, label: stay.name },
        });
      }
      stops.push({
        id: `${day}-return-flight`,
        day,
        startTime: flight.returnTime,
        endTime: formatMinutes(minutesOf(flight.returnTime) + 45),
        title: `Return via ${flight.airportName}`,
        category: "flight",
        location: {
          lat: flight.airportLat,
          lng: flight.airportLng,
          label: flight.airportName,
        },
        payer: "corporate",
        notes: "Demo fare estimate — not a confirmed ticket.",
      });
    }
  });

  for (const item of attractions) {
    stops.push({
      id: `${item.day}-${item.attraction.id}`,
      day: item.day,
      startTime: item.startTime,
      endTime: item.endTime,
      title: item.attraction.name,
      category: "attraction",
      location: {
        lat: item.attraction.lat,
        lng: item.attraction.lng,
        label: item.attraction.name,
      },
      estimatedCost: item.attraction.admissionAzn,
      currency: "AZN",
      payer: "personal",
      notes:
        item.attraction.admissionAzn === 0
          ? "Free in the demo catalog. Personal leisure is not reimbursable by default."
          : "Estimated admission. Personal leisure is not reimbursable by default.",
    });
  }

  return stops.sort(
    (a, b) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime),
  );
}
