import { Vehicle } from "./Vehicle";

export function FleetLegend() {
  return (
    <aside className="fleet-panel" aria-label="Fleet status legend">
      <span className="panel-label">Live fleet view</span>
      <Vehicle id="TRK-204" status="driving" route="I-85 North" />
      <Vehicle id="TRK-118" status="duty" route="I-40 East" />
      <Vehicle id="TRK-307" status="rest" route="US-29 South" />
      <div className="fleet-summary">
        <span><i className="legend-dot driving" /> Driving</span>
        <span><i className="legend-dot duty" /> On duty</span>
        <span><i className="legend-dot rest" /> Resting</span>
      </div>
    </aside>
  );
}
