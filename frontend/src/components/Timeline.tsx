import { HosChart } from "./HosChart";
import { TimelineEvent } from "../utils/driverLogTypes";
import { toMinutes } from "../utils";

type TimelineProps = {
    events: TimelineEvent[];
    editable?: boolean;
    onAdd?: () => void;
    onRemove?: (id: number) => void;
    onUpdate?: (id: number, field: "start" | "end", minutes: number, status: string) => void;
    onSelect?: (id: number) => void;
};

export function Timeline({ events, editable = false, onAdd, onRemove, onUpdate, onSelect }: TimelineProps) {
    const orderedEvents = [...events].sort((left, right) => toMinutes(left.start) - toMinutes(right.start));
    const lastKeypointMinutes = orderedEvents.length ? toMinutes(orderedEvents[orderedEvents.length - 1].start) : 1440;
    return (
        <section className="timeline-section" aria-label="Daily timeline">
            <div className="timeline-heading">
                <div><span className="form-label">Hours of service chart</span><h2>Daily duty chart</h2></div>
                {editable && <button className="add-event-button" disabled={lastKeypointMinutes >= 1440} onClick={onAdd} type="button"><span>+</span> Add keypoint</button>}
            </div>
            <HosChart events={events} editable={editable} onUpdate={onUpdate} onSelect={onSelect} />
            {editable && orderedEvents.length > 1 && <div className="timeline-remove-list">{orderedEvents.slice(1).map((event) => <button key={event.id} onClick={() => onRemove?.(event.id)} type="button">Remove {event.start} {event.status}</button>)}</div>}
        </section>
    );
}
