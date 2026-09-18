import { FormEvent, useMemo, useState } from "react";
import { DriverLogMetrics } from "../components/DriverLogMetrics";
import { DutyGrid } from "../components/DutyGrid";
import { LogFields } from "../components/LogFields";
import { Timeline } from "../components/Timeline";
import { DriverLog, TimelineEvent, dutyRows } from "../utils/driverLogTypes";
import { formatDate, formatTime, getDutyHours, toMinutes } from "../utils";

const initialLog: DriverLog = {
	driverNumber: "1224213",
	date: "2026-09-17",
	initials: "YS",
	signature: "Your Signature",
	vehicleNumber: "48872",
	trailerNumber: "TA939200",
	coDriver: "",
	homeTerminal: "Green Bay, WI",
	shipper: "Don's Paper Co.",
	commodity: "Paper products",
	loadNumber: "ST13241564114",
	driverMiles: 427,
	truckMiles: 427,
	dutyHours: {
		"Off duty": 8,
		"Sleeper": 0,
		"Driving": 10,
		"On duty": 6,
	},
};

const initialTimeline: TimelineEvent[] = [
	{
		id: 1,
		status: "Off duty",
		start: "00:00",
		end: "06:00",
		location: "Green Bay, WI",
		note: "Rest",
	},
	{
		id: 2,
		status: "Driving",
		start: "06:00",
		end: "12:00",
		location: "I-43 North",
		note: "En route to shipper",
	},
	{
		id: 3,
		status: "On duty",
		start: "12:00",
		end: "18:00",
		location: "Green Bay, WI",
		note: "Loading and paperwork",
	},
	{
		id: 4,
		status: "Driving",
		start: "18:00",
		end: "22:00",
		location: "US-41 South",
		note: "Load in transit",
	},
	{
		id: 5,
		status: "Off duty",
		start: "22:00",
		end: "24:00",
		location: "Appleton, WI",
		note: "Parked",
	},
];

export function DriverLogPage() {
	const [mode, setMode] = useState<"edit" | "view">("edit");
	const [log, setLog] = useState(initialLog);
	const [timeline, setTimeline] = useState(initialTimeline);
	const [saved, setSaved] = useState(false);

	const totalHours = useMemo(
		() =>
			Object.values(log.dutyHours).reduce((total, hours) => total + hours, 0),
		[log.dutyHours],
	);
	const setField = <K extends keyof DriverLog>(
		field: K,
		value: DriverLog[K],
	) => {
		setSaved(false);
		setLog((current) => ({ ...current, [field]: value }));
	};

	const setDutyHours = (duty: string, value: string) => {
		setSaved(false);
		setLog((current) => ({
			...current,
			dutyHours: {
				...current.dutyHours,
				[duty]: Math.max(0, Math.min(24, Number(value) || 0)),
			},
		}));
	};

	const addTimelineEvent = () => {
		const orderedTimeline = [...timeline].sort(
			(left, right) => toMinutes(left.start) - toMinutes(right.start),
		);
		const lastEvent = orderedTimeline[orderedTimeline.length - 1];
		if (!lastEvent) return;
		const lastKeypointMinutes = toMinutes(lastEvent.start);
		if (lastKeypointMinutes >= 1440) return;
		const startMinutes = Math.min(1440, lastKeypointMinutes + 15);
		const endMinutes = 1440;
		if (endMinutes < startMinutes) return;
		const nextStatus =
			dutyRows.find((duty) => duty !== lastEvent.status) ?? dutyRows[0];
		const nextTimeline = [
			...orderedTimeline.slice(0, -1),
			{ ...lastEvent, end: formatTime(startMinutes) },
			{
				id: orderedTimeline.reduce((highest, event) => Math.max(highest, event.id), 0) + 1,
				status: nextStatus,
				start: formatTime(startMinutes),
				end: formatTime(endMinutes),
				location: "Location not added",
				note: "New event",
			},
		];
		setTimeline(nextTimeline);
		setLog((current) => ({
			...current,
			dutyHours: getDutyHours(nextTimeline),
		}));
		setSaved(false);
	};

	const removeTimelineEvent = (id: number) => {
		const nextTimeline = timeline.filter((event) => event.id !== id);
		setTimeline(nextTimeline);
		setLog((current) => ({
			...current,
			dutyHours: getDutyHours(nextTimeline),
		}));
		setSaved(false);
	};

	const updateTimelineNote = (id: number, note: string) => {
		setSaved(false);
		setTimeline((current) => current.map((event) => event.id === id ? { ...event, note } : event));
	};

	const updateTimelineEvent = (
		id: number,
		field: "start" | "end",
		minutes: number,
		status: string,
	) => {
		const currentEvent = timeline.find((event) => event.id === id);
		if (!currentEvent) return;
		const minimumGap = 15;
		const orderedTimeline = [...timeline].sort(
			(left, right) => toMinutes(left.start) - toMinutes(right.start),
		);
		const eventIndex = orderedTimeline.findIndex((event) => event.id === id);
		const previousEvent = orderedTimeline[eventIndex - 1];
		const nextEvent = orderedTimeline[eventIndex + 1];
		const previousLimit = previousEvent
			? toMinutes(previousEvent.start) + minimumGap
			: 0;
		const nextLimit = nextEvent
			? toMinutes(nextEvent.start) - minimumGap
			: 1440;
		const boundedMinutes =
			eventIndex === orderedTimeline.length - 1 && field === "start"
				? Math.min(1440, Math.max(previousLimit, minutes))
				: eventIndex === 0 && field === "start"
					? 0
					: field === "start"
						? Math.max(
							previousLimit,
							Math.min(
								toMinutes(currentEvent.end) - minimumGap,
								Math.min(nextLimit, minutes),
							),
						)
						: Math.min(
							nextLimit,
							Math.max(
								toMinutes(currentEvent.start) + minimumGap,
								Math.max(previousLimit, minutes),
							),
						);
		const nextTime = `${String(Math.floor(boundedMinutes / 60)).padStart(2, "0")}:${String(boundedMinutes % 60).padStart(2, "0")}`;
		const adjacentStatusConflict =
			(previousEvent && previousEvent.status === status) ||
			(nextEvent && nextEvent.status === status);
		const nextTimeline = timeline
			.map((event) => {
				if (event.id === id) {
					const updatedEvent = {
						...event,
						[field]: nextTime,
						...(adjacentStatusConflict ? {} : { status }),
					};
					if (field === "start" && boundedMinutes === 1440)
						updatedEvent.end = "24:00";
					return updatedEvent;
				}
				if (field === "start" && previousEvent && event.id === previousEvent.id)
					return { ...event, end: nextTime };
				return event;
			})
			.sort((left, right) => toMinutes(left.start) - toMinutes(right.start));
		setTimeline(nextTimeline);
		setLog((current) => ({
			...current,
			dutyHours: getDutyHours(nextTimeline),
		}));
		setSaved(false);
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		setSaved(true);
		setMode("view");
	};

	return (
		<main className="driver-shell">
			<header className="driver-header">
				<a className="driver-brand" href="/">
					SCHNEIDER<span>®</span>
				</a>
				<div className="driver-header-copy">
					<p className="driver-kicker">Fleet operations / driver records</p>
					<h1>Driver's daily log</h1>
				</div>
				<div className="driver-actions">
					<button
						aria-pressed={mode === "edit"}
						className="mode-switch"
						onClick={() => setMode(mode === "edit" ? "view" : "edit")}
						type="button"
					>
						<span
							className={`switch-track ${mode === "edit" ? "is-editing" : ""}`}
						>
							<i />
						</span>
						<span>{mode === "edit" ? "Edit mode" : "View mode"}</span>
					</button>
				</div>
			</header>

			<div className="driver-content">
				<section className="log-paper" aria-label="Driver daily log">
					<div className="log-paper-topline">
						<span>Driver's daily log</span>
						<span>One calendar day · 24 hours</span>
						<strong>{formatDate(log.date)}</strong>
					</div>
					<form onSubmit={handleSubmit}>
						<LogFields
							log={log}
							setField={setField}
							disabled={mode === "view"}
						/>
						<Timeline
							events={timeline}
							editable={mode === "edit"}
							onAdd={addTimelineEvent}
							onRemove={removeTimelineEvent}
							onUpdate={updateTimelineEvent}
							onUpdateNote={updateTimelineNote}
						/>
						<div className="shipment-fields">
							<div className="shipment-field">
								<label htmlFor="shipper">Shipper</label>
								<input
									disabled={mode === "view"}
									id="shipper"
									value={log.shipper}
									onChange={(event) => setField("shipper", event.target.value)}
								/>
							</div>
							<div className="shipment-field">
								<label htmlFor="commodity">Commodity</label>
								<input
									disabled={mode === "view"}
									id="commodity"
									value={log.commodity}
									onChange={(event) => setField("commodity", event.target.value)}
								/>
							</div>
							<div className="shipment-field">
								<label htmlFor="load-number">Load no.</label>
								<input
									disabled={mode === "view"}
									id="load-number"
									value={log.loadNumber}
									onChange={(event) => setField("loadNumber", event.target.value)}
								/>
							</div>
						</div>
						<DutyGrid
							log={log}
							setDutyHours={setDutyHours}
							editable={mode === "edit"}
						/>
						<div className="remarks-row">
							<label htmlFor="remarks">Remarks</label>
							<textarea
								disabled={mode === "view"}
								id="remarks"
								placeholder="Add locations or a note for this shift..."
							/>
						</div>
						{mode === "edit" ? (
							<button className="save-log" type="submit">
								Save daily log <span>→</span>
							</button>
						) : (
							<div className="view-remarks">
								<span>View only</span>
								<p>Switch to Edit mode to change this daily log.</p>
							</div>
						)}
						{saved && (
							<p className="saved-message">
								Log saved locally and ready to share.
							</p>
						)}
					</form>
				</section>

				<DriverLogMetrics
					driverMiles={log.driverMiles}
					truckMiles={log.truckMiles}
					totalHours={totalHours}
				/>
			</div>
		</main>
	);
}


