import { DriverLog } from "../utils/driverLogTypes";

type LogFieldsProps = {
  log: DriverLog;
  setField: <K extends keyof DriverLog>(field: K, value: DriverLog[K]) => void;
  disabled?: boolean;
};

export function LogFields({ log, setField, disabled = false }: LogFieldsProps) {
  return (
    <div className="log-fields">
      <div className="field-block field-driver">
        <label htmlFor="driver-number">Driver number</label>
        <input
          disabled={disabled}
          id="driver-number"
          value={log.driverNumber}
          onChange={(event) => setField("driverNumber", event.target.value)}
        />
      </div>
      <div className="field-block">
        <label htmlFor="log-date">Date</label>
        <input
          disabled={disabled}
          id="log-date"
          type="date"
          value={log.date}
          onChange={(event) => setField("date", event.target.value)}
        />
      </div>
      <div className="field-block field-initials">
        <label htmlFor="initials">Initials</label>
        <input
          disabled={disabled}
          id="initials"
          maxLength={4}
          value={log.initials}
          onChange={(event) => setField("initials", event.target.value.toUpperCase())}
        />
      </div>
      <div className="field-block field-signature">
        <label htmlFor="signature">Driver signature</label>
        <input
          disabled={disabled}
          id="signature"
          className="signature-input"
          value={log.signature}
          onChange={(event) => setField("signature", event.target.value)}
        />
      </div>
      <div className="field-block">
        <label htmlFor="vehicle-number">Vehicle no.</label>
        <input
          disabled={disabled}
          id="vehicle-number"
          value={log.vehicleNumber}
          onChange={(event) => setField("vehicleNumber", event.target.value)}
        />
      </div>
      <div className="field-block">
        <label htmlFor="trailer-number">Trailer no.</label>
        <input
          disabled={disabled}
          id="trailer-number"
          value={log.trailerNumber}
          onChange={(event) => setField("trailerNumber", event.target.value)}
        />
      </div>
      <div className="field-block field-wide">
        <label htmlFor="co-driver">Co-driver</label>
        <input
          disabled={disabled}
          id="co-driver"
          placeholder="No co-driver"
          value={log.coDriver}
          onChange={(event) => setField("coDriver", event.target.value)}
        />
      </div>
      <div className="field-block field-wide">
        <label htmlFor="home-terminal">Home operating center / address</label>
        <input
          disabled={disabled}
          id="home-terminal"
          value={log.homeTerminal}
          onChange={(event) => setField("homeTerminal", event.target.value)}
        />
      </div>
      <div className="field-block">
        <label htmlFor="driver-miles">Driver miles</label>
        <input
          disabled={disabled}
          id="driver-miles"
          type="number"
          min="0"
          value={log.driverMiles}
          onChange={(event) => setField("driverMiles", Number(event.target.value))}
        />
      </div>
      <div className="field-block">
        <label htmlFor="truck-miles">Truck miles</label>
        <input
          disabled={disabled}
          id="truck-miles"
          type="number"
          min="0"
          value={log.truckMiles}
          onChange={(event) => setField("truckMiles", Number(event.target.value))}
        />
      </div>
    </div>
  );
}
