"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { accommodationSearchUrl, directionsUrl, flightSearchUrl } from "@/lib/utils/booking-links";
import type { TripPackage, TripRecord } from "@/types/travel";

const LABEL: Record<string, string> = {
  not_started: "Not started",
  ready_for_booking: "Ready for external search",
  external_search_opened: "External search opened",
  booking_confirmation_pending: "Confirmation pending",
  confirmed_by_user: "Confirmed by user",
};

export function BookingHandoff({
  record,
  pkg,
  onOpen,
  onStatus,
}: {
  record: TripRecord;
  pkg?: TripPackage;
  onOpen: (target: "flights" | "accommodation" | "directions") => void;
  onStatus: (target: "flights" | "accommodation" | "directions", status: "booking_confirmation_pending" | "confirmed_by_user") => void;
}) {
  const request = record.request;
  const stay = pkg?.accommodation?.location;
  const airport = pkg?.flight.location;
  const directions = stay && airport ? directionsUrl(airport, { lat: stay.lat, lng: stay.lng }) : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking handoff</CardTitle>
        <p className="text-sm text-muted-foreground">Continue to provider. Opening a link does not confirm a booking.</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <a href={flightSearchUrl(request)} target="_blank" rel="noreferrer" onClick={() => onOpen("flights")}>
            <Button type="button" variant="outline" size="sm">Search flights</Button>
          </a>
          <Badge variant="outline">{LABEL[record.handoff.flights]}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={accommodationSearchUrl(request)} target="_blank" rel="noreferrer" onClick={() => onOpen("accommodation")}>
            <Button type="button" variant="outline" size="sm">Find accommodation</Button>
          </a>
          <Badge variant="outline">{LABEL[record.handoff.accommodation]}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {directions ? (
            <a href={directions} target="_blank" rel="noreferrer" onClick={() => onOpen("directions")}>
              <Button type="button" variant="outline" size="sm">Open directions</Button>
            </a>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled>Open directions</Button>
          )}
          <Badge variant="outline">{LABEL[record.handoff.directions]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Only mark a booking if you actually completed it with the provider.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => onStatus("flights", "booking_confirmation_pending")}>
            Flight confirmation pending
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => onStatus("flights", "confirmed_by_user")}>
            I confirmed the flight
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
