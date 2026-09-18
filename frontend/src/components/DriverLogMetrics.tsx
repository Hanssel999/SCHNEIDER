import { RoadMap } from "./RoadMap";
import { DriverRouteIntake, GeneratedRoute } from "../services/driverRoute";
import { TimelineEvent } from "../utils/driverLogTypes";

type DriverLogMetricsProps = {
  driverMiles: number;
  truckMiles: number;
  totalHours: number;
  timeline: TimelineEvent[];
  route: DriverRouteIntake | null;
  generatedRoute: GeneratedRoute | null;
};

export function DriverLogMetrics({ driverMiles, truckMiles, totalHours, timeline, route, generatedRoute }: DriverLogMetricsProps) {
  const mapEvents = generatedRoute?.daily_logs?.flatMap((day) =>
    day.events.map((event) => ({
      ...event,
      note: `${day.date_label} · ${event.note}`,
    })),
  ) ?? timeline;

  return (
    <aside className="metrics-panel" aria-label="Calculated totals">
      <div className="metrics-intro">
        <span className="section-index">01 / 03</span>
        <h2>Read the road.</h2>
        <p>Keep the paper log precise, then hand it back to the fleet in one clear view.</p>
      </div>
      <div className="metric-list">
        <Metric label="Total driving miles" value={driverMiles.toLocaleString()} suffix="mi" />
        <Metric label="Total truck miles" value={truckMiles.toLocaleString()} suffix="mi" />
        <Metric label="Total hours today" value={totalHours.toString()} suffix="hrs" />
      </div>
      <div className="status-note">
        <span className="status-pip" />
        <span>{totalHours === 24 ? "Log complete · 24 hours accounted for" : `${24 - totalHours} hours still unassigned`}</span>
      </div>
      <RoadMap
        events={mapEvents}
        route={route}
        generatedRoute={generatedRoute}
      />
    </aside>
  );
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}<small>{suffix}</small></strong></div>;
}
