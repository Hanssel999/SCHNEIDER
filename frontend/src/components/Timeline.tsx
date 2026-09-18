import { HosChart } from "./HosChart";
import { TimelineEvent } from "./driverLogTypes";
import { toMinutes } from "../utils";

type TimelineProps = {
  events: TimelineEvent[];
  editable?: boolean;
  onAdd?: () => void;
  onRemove?: (id: number) => void;
  onUpdate?: (id: number, field: "start" | "end", minutes: number, status: string) => void;
};

export function Timeline({ events, editable = false, onAdd, onRemove, onUpdate }: TimelineProps) {
  const orderedEvents = [...events].sort((left, right) => toMinutes(left.start) - toMinutes(right.start));
  const lastKeypointMinutes = orderedEvents.length ? toMinutes(orderedEvents[orderedEvents.length - 1].start) : 1440;

  return (
    <section className="timeline-section" aria-label="Daily timeline">
      <div className="timeline-heading">
        <div><span className="form-label">Hours of service chart</span><h2>Daily duty chart</h2></div>
        {editable && <button className="add-event-button" disabled={lastKeypointMinutes >= 1440} onClick={onAdd} type="button"><span>+</span> Add keypoint</button>}
      </div>
      <HosChart events={events} editable={editable} onUpdate={onUpdate} />
      <div className="timeline-remarks-label">Remarks</div>
      <div className="timeline-event-list">{events.map((event) => <div className="timeline-event-detail" key={event.id}><span className={`event-dot timeline-dot-${event.status.toLowerCase().replace(" ", "-")}`} /><strong>{event.start} - {event.end}</strong><span>{event.location}</span><small>{event.note}</small></div>)}</div>
      {editable && events.length > 0 && <div className="timeline-remove-list">{events.map((event) => <button key={event.id} onClick={() => onRemove?.(event.id)} type="button">Remove {event.start} {event.status}</button>)}</div>}
    </section>
  );
}
