"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  schedule?: string;
  estimatedCost?: string;
  color: string;
  glyph: string;
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lng]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
  }, [map, markers]);
  return null;
}

function iconFor(marker: MapMarker) {
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
    html: `<div style="width:32px;height:32px;border-radius:999px;background:${marker.color};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(11,31,58,.35)">${marker.glyph}</div>`,
  });
}

export default function TravelMapInner({ markers }: { markers: MapMarker[] }) {
  const center = markers[0] ?? { lat: 41.0086, lng: 28.9802 };
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom
      className="h-[360px] w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds markers={markers} />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={iconFor(marker)}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{marker.name}</p>
              <p>{marker.category}</p>
              {marker.schedule ? <p>{marker.schedule}</p> : null}
              {marker.estimatedCost ? <p>{marker.estimatedCost}</p> : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
