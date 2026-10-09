"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "@/components/travel/travel-map-inner";

const TravelMapInner = dynamic(() => import("@/components/travel/travel-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function TravelMap({ markers }: { markers: MapMarker[] }) {
  if (markers.length === 0) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-dashed border-border bg-muted px-6 text-center text-sm text-muted-foreground">
        Generate a plan to place the airport, stay, meeting, and attractions on the map.
      </div>
    );
  }
  return <TravelMapInner markers={markers} />;
}

export type { MapMarker };
