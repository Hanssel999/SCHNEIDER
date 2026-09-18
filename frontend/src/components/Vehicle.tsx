export type VehicleStatus = "driving" | "duty" | "rest";

type VehicleProps = {
  id: string;
  status: VehicleStatus;
  route: string;
};

const statusLabels: Record<VehicleStatus, string> = {
  driving: "Driving",
  duty: "On duty",
  rest: "Resting",
};

export function Vehicle({ id, status, route }: VehicleProps) {
  return (
    <div className="vehicle-row">
      <span className={`vehicle-icon ${status}`} aria-hidden="true">
        <span className="vehicle-cab" />
      </span>
      <span className="vehicle-details">
        <strong>{id}</strong>
        <small>{route}</small>
      </span>
      <span className={`vehicle-state ${status}`}>{statusLabels[status]}</span>
    </div>
  );
}
