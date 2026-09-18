import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import { DriverRouteIntake } from "../services/driverRoute";
import { GeneratedRoute } from "../services/driverRoute";
import { TimelineEvent } from "../utils/driverLogTypes";

type RoadMapProps = {
  events: TimelineEvent[];
  route: DriverRouteIntake | null;
  generatedRoute: GeneratedRoute | null;
};

type RouteStop = { name: string; lat: number; lng: number };

export function RoadMap({ events, route, generatedRoute }: RoadMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const activeEvent = [...events].reverse().find((event) => event.status === "Driving");
  const routeStops: RouteStop[] = route ? [
    { name: route.current_location, lat: route.current_latitude ?? 0, lng: route.current_longitude ?? 0 },
    { name: route.pickup_location, lat: route.pickup_latitude ?? 0, lng: route.pickup_longitude ?? 0 },
    { name: route.dropoff_location, lat: route.dropoff_latitude ?? 0, lng: route.dropoff_longitude ?? 0 },
  ].filter((stop) => stop.lat !== 0 && stop.lng !== 0) : [];

  useEffect(() => {
    if (!mapElement.current) return;

    const origin = routeStops[0] ?? { lat: 39.5, lng: -98.35 };
    const map = L.map(mapElement.current, { zoomControl: true }).setView([origin.lat, origin.lng], routeStops.length ? (isExpanded ? 8 : 7) : 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    if (routeStops.length > 1) {
      const routeLine = L.polyline(generatedRoute?.geometry?.length ? generatedRoute.geometry : routeStops.map((stop) => [stop.lat, stop.lng] as [number, number]), { color: "#ef6e1c", weight: 6, opacity: 0.95 }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [24, 24] });
    }
    routeStops.forEach((stop) => {
      L.circleMarker([stop.lat, stop.lng], {
        radius: 6,
        color: "#24312e",
        weight: 2,
        fillColor: "#fffdf7",
        fillOpacity: 1,
      }).addTo(map).bindTooltip(stop.name, { permanent: true, direction: "right", offset: [8, 0] });
    });
    let lastStopCoordinates: [number, number] | undefined = routeStops[0]
      ? [routeStops[0].lat, routeStops[0].lng]
      : undefined;
    events
      .filter((event) => event.status !== "Driving")
      .forEach((event) => {
        const fallbackStop = routeStops.find((stop) => stop.name === event.city || stop.name === event.location);
        const coordinates: [number, number] | undefined = event.latitude !== undefined && event.longitude !== undefined
          ? [event.latitude, event.longitude]
          : fallbackStop
            ? [fallbackStop.lat, fallbackStop.lng]
            : lastStopCoordinates;
        if (!coordinates) return;
        lastStopCoordinates = coordinates;
        L.circleMarker(coordinates, {
          radius: 8,
          color: "#111",
          weight: 2,
          fillColor: "#111",
          fillOpacity: 1,
        }).addTo(map).bindTooltip(`${event.location} · ${event.note}`, {
          direction: "top",
          offset: [0, -8],
          permanent: true,
          className: "map-stop-sign",
        });
      });
    if (routeStops.length) L.circleMarker([origin.lat, origin.lng], {
      radius: 11,
      color: "#ef6e1c",
      weight: 3,
      fillColor: "#fffdf7",
      fillOpacity: 1,
    }).addTo(map).bindTooltip("Origin · " + origin.name, { permanent: false });

    return () => {
      map.remove();
    };
  }, [isExpanded, route, generatedRoute]);

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
        {!routeStops.length && <div className="road-map-empty">Generate a route to plot it on the map.</div>}
      </div>
      <div className="road-map-footer">
        <span>{activeEvent?.location ?? "Route pending"}</span>
        <strong>{activeEvent?.status ?? "Off duty"}</strong>
      </div>
    </section>
  );
}