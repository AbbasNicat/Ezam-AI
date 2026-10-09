import type { TravelRequest } from "@/types/travel";

export function flightSearchUrl(request: TravelRequest): string {
  const query = `Flights from ${request.origin} to ${request.destination} on ${request.departureDate} through ${request.returnDate}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

export function accommodationSearchUrl(request: TravelRequest): string {
  const params = new URLSearchParams({
    ss: request.destination,
    checkin: request.departureDate,
    checkout: request.returnDate,
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export function directionsUrl(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): string {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
