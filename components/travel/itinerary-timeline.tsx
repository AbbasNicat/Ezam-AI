import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ItineraryStop } from "@/types/travel";

export function ItineraryTimeline({ stops }: { stops: ItineraryStop[] }) {
  if (stops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Itinerary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The day-by-day schedule is built after a package is selected. Meetings block leisure time.
        </CardContent>
      </Card>
    );
  }
  const days = [...new Set(stops.map((stop) => stop.day))];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Itinerary</CardTitle>
        <p className="text-sm text-muted-foreground">Business commitments stay ahead of optional sightseeing.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {days.map((day) => (
          <div key={day}>
            <p className="mb-2 text-sm font-semibold">{day}</p>
            <ol className="space-y-2 border-l border-border pl-4">
              {stops.filter((stop) => stop.day === day).map((stop) => (
                <li key={stop.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">
                    {stop.startTime}–{stop.endTime} · {stop.title}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {stop.category}
                    {stop.payer ? ` · ${stop.payer}` : ""}
                    {stop.estimatedCost !== undefined ? ` · est. ${stop.estimatedCost} ${stop.currency ?? "AZN"}` : ""}
                  </p>
                  {stop.notes ? <p className="text-xs text-muted-foreground">{stop.notes}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
