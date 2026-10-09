import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditEvent } from "@/types/travel";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Actions are recorded here and kept in this browser after refresh.</p>
        ) : (
          <ol className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <p className="text-sm font-medium">{event.description}</p>
                <p className="text-xs text-muted-foreground">{event.actor} · {event.type.replaceAll("_", " ")}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
