import { DriverLog, dutyRows, hourLabels } from "../utils/driverLogTypes";

type DutyGridProps = {
  log: DriverLog;
};

export function DutyGrid({ log }: DutyGridProps) {
  return (
    <section className="duty-section" aria-label="Duty status hours">
      <div className="duty-heading">
        <div>
          <span className="form-label">Duty status</span>
          <h2>Hours on the road</h2>
        </div>
        <span className="hours-caption">Total hours / 24</span>
      </div>
      <div className="hour-scale">
        {hourLabels.map((hour) => (
          <span key={hour}>{hour === 0 ? "M" : hour === 12 ? "N" : hour === 24 ? "M" : hour}</span>
        ))}
      </div>
      <div className="duty-rows">
        {dutyRows.map((duty, rowIndex) => (
          <div className="duty-row" key={duty}>
            <span className={`duty-name duty-${rowIndex}`}>{duty}</span>
            <div className="duty-track">
              {Array.from({ length: 24 }, (_, index) => (
                <i className={index < log.dutyHours[duty] ? `filled duty-fill-${rowIndex}` : ""} key={index} />
              ))}
            </div>
            <label className="duty-hours">
              <input aria-label={`${duty} hours`} readOnly type="text" min="0" max="24" value={log.dutyHours[duty]} /> h
            </label>
          </div>
        ))}
      </div>
      <div className="duty-total">
        <span>Total hours</span>
        <strong>{Math.round(Object.values(log.dutyHours).reduce((sum, value) => sum + value, 0))} / 24</strong>
      </div>
    </section>
  );
}
