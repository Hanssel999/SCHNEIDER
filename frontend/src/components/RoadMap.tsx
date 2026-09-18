import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { TimelineEvent } from "../utils/driverLogTypes";

type RoadMapProps = {
  events: TimelineEvent[];
};

type RouteStop = { name: string; lat: number; lng: number };

const routeStops: RouteStop[] = [
  { name: "Green Bay", lat: 44.5133, lng: -88.0133 },
  { name: "Appleton", lat: 44.2619, lng: -88.4154 },
  { name: "Oshkosh", lat: 44.0247, lng: -88.5426 },
  { name: "Madison", lat: 43.0731, lng: -89.4012 },
];

export function RoadMap({ events }: RoadMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const activeEvent = [...events].reverse().find((event) => event.status === "Driving");

  useEffect(() => {
    if (!mapElement.current) return;

    const origin = routeStops[0];
    const map = L.map(mapElement.current, { zoomControl: true }).setView(
      [origin.lat, origin.lng],
      isExpanded ? 8 : 7,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.polyline(routeStops.map((stop) => [stop.lat, stop.lng] as [number, number]), {
      color: "#ef6e1c",
      weight: 6,
      opacity: 0.95,
    }).addTo(map);
    routeStops.forEach((stop) => {
      L.circleMarker([stop.lat, stop.lng], {
        radius: 6,
        color: "#24312e",
        weight: 2,
        fillColor: "#fffdf7",
        fillOpacity: 1,
      }).addTo(map).bindTooltip(stop.name, { permanent: true, direction: "right", offset: [8, 0] });
    });
    L.circleMarker([origin.lat, origin.lng], {
      radius: 11,
      color: "#ef6e1c",
      weight: 3,
      fillColor: "#fffdf7",
      fillOpacity: 1,
    }).addTo(map).bindTooltip("Origin · Green Bay", { permanent: false });

    return () => {
      map.remove();
    };
  }, [isExpanded]);

  return (
    <section className="road-map" aria-label="Current road route">
      <div className="road-map-heading">
        <div>
          <span className="section-index">02 / 03</span>
          <h2>Route view</h2>
        </div>
        <span className="road-map-live"><i /> {activeEvent?.status ?? "Live"}</span>
      </div>
      <div
        className={`road-map-canvas ${isExpanded ? "is-expanded" : ""}`}
        onClick={(event) => {
          const start = pointerStart.current;
          pointerStart.current = null;
          if (!start) return;
          const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
          if (distance < 8) setIsExpanded(true);
        }}
        onPointerDown={(event) => {
          pointerStart.current = { x: event.clientX, y: event.clientY };
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") setIsExpanded(true);
        }}
      >
        {isExpanded && (
          <button
            aria-label="Close full-size map"
            className="road-map-close"
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded(false);
            }}
            type="button"
          >
            ×
          </button>
        )}
        <div className="leaflet-map" ref={mapElement} />
      </div>
      <div className="road-map-footer">
        <span>{activeEvent?.location ?? "Route pending"}</span>
        <strong>{activeEvent?.status ?? "Off duty"}</strong>
      </div>
    </section>
  );
}