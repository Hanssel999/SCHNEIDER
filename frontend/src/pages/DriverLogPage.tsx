import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DriverLogMetrics } from "../components/DriverLogMetrics";
import { DriverRouteDialog } from "../components/DriverRouteDialog";
import { DutyGrid } from "../components/DutyGrid";
import { LogFields } from "../components/LogFields";
import { Timeline } from "../components/Timeline";
import { DriverLog, TimelineEvent, dutyRows } from "../utils/driverLogTypes";
import { formatDate, formatTime, getDutyHours, toMinutes } from "../utils";
import { driverRouteService, DriverRouteIntake, GeneratedRoute } from "../services/driverRoute";
import { authService } from "../services/auth";

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
		country: "United States",
		city: "Green Bay",
		note: "Rest",
	},
	{
		id: 2,
		status: "Driving",
		start: "06:00",
		end: "12:00",
		location: "I-43 North",
		country: "United States",
		city: "Green Bay",
		note: "En route to shipper",
	},
	{
		id: 3,
		status: "On duty",
		start: "12:00",
		end: "18:00",
		location: "Green Bay, WI",
		country: "United States",
		city: "Green Bay",
		note: "Loading and paperwork",
	},
	{
		id: 4,
		status: "Driving",
		start: "18:00",
		end: "22:00",
		location: "US-41 South",
		country: "United States",
		city: "Green Bay",
		note: "Load in transit",
	},
	{
		id: 5,
		status: "Off duty",
		start: "22:00",
		end: "24:00",
		location: "Appleton, WI",
		country: "United States",
		city: "Appleton",
		note: "Parked",
	},
];

export function DriverLogPage() {
	const navigate = useNavigate();
	const [routeData, setRouteData] = useState<DriverRouteIntake | null>(null);
	const [routeChecked, setRouteChecked] = useState(false);
	const [routeError, setRouteError] = useState<string | null>(null);
	const [showRouteDialog, setShowRouteDialog] = useState(false);
	const [generatedRoute, setGeneratedRoute] = useState<GeneratedRoute | null>(null);
	const [selectedDay, setSelectedDay] = useState(0);
	const [mode, setMode] = useState<"edit" | "view">("edit");
	const [log, setLog] = useState(initialLog);
	const [timeline, setTimeline] = useState(initialTimeline);
	const [saved, setSaved] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
	const [eventDraft, setEventDraft] = useState({ country: "", city: "", note: "" });
	const selectedEvent = timeline.find((event) => event.id === selectedEventId) ?? null;

	useEffect(() => {
		driverRouteService.get()
			.then((data) => {
				setRouteError(null);
				setRouteData(data.intake);
				if (data.route?.timeline?.length && data.intake) applyGeneratedRoute(data.route, data.intake, data.daily_log);
			})
			.catch(() => setRouteError("Could not retrieve route data. Check that the backend is running."))
			.finally(() => setRouteChecked(true));
	}, []);

	const applyGeneratedRoute = (route: GeneratedRoute, intake: DriverRouteIntake = routeData!, savedDailyLog?: { log: Record<string, unknown>; timeline: GeneratedRoute["timeline"]; day: number }) => {
		setGeneratedRoute(route);
		setSelectedDay(0);
		const firstDay = route.daily_logs[0]?.events ?? route.timeline;
		const firstDayLog = route.daily_logs[0];
		setTimeline(firstDay);
		setLog((current) => ({
			...current,
			date: new Date().toISOString().slice(0, 10),
			homeTerminal: intake.current_location,
			shipper: intake.pickup_location,
			driverMiles: firstDayLog?.driver_miles ?? drivingMilesForDay(firstDay),
			truckMiles: firstDayLog?.truck_miles ?? drivingMilesForDay(firstDay),
			dutyHours: getDutyHours(firstDay),
		}));
		if (savedDailyLog) {
			setSelectedDay(savedDailyLog.day);
			setTimeline(savedDailyLog.timeline);
			setLog((current) => ({ ...current, ...savedDailyLog.log, dutyHours: getDutyHours(savedDailyLog.timeline) }));
		}
	};

	const selectDay = (dayIndex: number) => {
		const day = generatedRoute?.daily_logs[dayIndex];
		if (!day) return;
		setSelectedDay(dayIndex);
		setTimeline(day.events);
		setLog((current) => ({
			...current,
			driverMiles: day.driver_miles ?? drivingMilesForDay(day.events),
			truckMiles: day.truck_miles ?? drivingMilesForDay(day.events),
			dutyHours: getDutyHours(day.events),
		}));
	};

	const drivingMilesForDay = (events: TimelineEvent[]) => events
		.filter((event) => event.status === "Driving")
		.reduce((miles, event) => {
			const [startHour, startMinute] = event.start.split(":").map(Number);
			const [endHour, endMinute] = event.end.split(":").map(Number);
			return miles + ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60 * 55;
		}, 0);

	const generateDailyLog = async (data: DriverRouteIntake) => {
		setRouteError(null);
		try {
			const savedRoute = await driverRouteService.save(data);
			setRouteData(savedRoute.intake);
			applyGeneratedRoute(savedRoute.route, savedRoute.intake);
			setShowRouteDialog(false);
		} catch (error) {
			setRouteError(error instanceof Error ? error.message : "Could not generate the daily log.");
			throw error;
		}
	};

	const totalHours = useMemo(
		() =>
			Math.round(Object.values(log.dutyHours).reduce((total, hours) => total + hours, 0)),
		[log.dutyHours],
	);
	const setField = <K extends keyof DriverLog>(
		field: K,
		value: DriverLog[K],
	) => {
		setSaved(false);
		setLog((current) => ({ ...current, [field]: value }));
	};

	const signOut = () => {
		authService.signOut();
		navigate("/signin", { replace: true });
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
				country: "",
				city: "",
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

	const updateTimelineDetails = (id: number, country: string, city: string, note: string) => {
		setSaved(false);
		setTimeline((current) => current.map((event) => event.id === id ? {
			...event,
			country,
			city,
			location: [city, country].filter(Boolean).join(", ") || "Location not added",
			note,
		} : event));
		setSelectedEventId(null);
	};

	const openEventEditor = (id: number) => {
		const event = timeline.find((timelineEvent) => timelineEvent.id === id);
		if (!event) return;
		setEventDraft({ country: event.country, city: event.city, note: event.note });
		setSelectedEventId(id);
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

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		try {
			await driverRouteService.saveDailyLog({ log, timeline, day: selectedDay });
			setSaved(true);
			setMode("view");
		} catch (error) {
			setRouteError(error instanceof Error ? error.message : "Could not save the daily log.");
		}
	};

	if (!routeChecked || !routeData) {
		return <DriverRouteDialog initialData={routeData} loading={!routeChecked} error={routeError} onGenerate={generateDailyLog} />;
	}

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
					<button className="sign-out-button" onClick={signOut} type="button">Sign out</button>
				</div>
			</header>

			<div className="driver-content">
				<section className="log-paper" aria-label="Driver daily log">
					<div className="log-paper-topline">
						<span>Driver's daily log</span>
						<span>One calendar day · 24 hours</span>
						<strong>{formatDate(log.date)}</strong>
					</div>
					<div className="log-paper-actions">
						{routeData && <button className="route-setup-button" onClick={() => setShowRouteDialog(true)} type="button">Route setup</button>}
						<button
							aria-pressed={mode === "edit"}
							className="mode-switch"
							onClick={() => setMode(mode === "edit" ? "view" : "edit")}
							type="button"
						>
							<span className={`switch-track ${mode === "edit" ? "is-editing" : ""}`}><i /></span>
							<span>{mode === "edit" ? "Edit mode" : "View mode"}</span>
						</button>
					</div>
					<form onSubmit={handleSubmit}>
						<LogFields
							log={log}
							setField={setField}
							disabled={mode === "view"}
						/>
						{generatedRoute && generatedRoute.daily_logs.length > 1 && (
							<nav aria-label="Daily logs" className="daily-log-tabs">
								<span>Generated logs</span>
								{generatedRoute.daily_logs.map((day, index) => (
									<button aria-pressed={selectedDay === index} className={selectedDay === index ? "active" : ""} key={day.day} onClick={() => selectDay(index)} type="button">{day.date_label}</button>
								))}
							</nav>
						)}
						<Timeline
							events={timeline}
							editable={mode === "edit"}
							onAdd={addTimelineEvent}
							onRemove={removeTimelineEvent}
							onUpdate={updateTimelineEvent}
							onSelect={openEventEditor}
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
								Log saved to your driver account.
							</p>
						)}
					</form>
				</section>

				<DriverLogMetrics
					driverMiles={log.driverMiles}
					truckMiles={log.truckMiles}
					totalHours={totalHours}
					timeline={timeline}
					route={routeData}
					generatedRoute={generatedRoute}
				/>
			</div>

			{showRouteDialog && routeData && (
				<DriverRouteDialog initialData={routeData} loading={false} error={routeError} onCancel={() => setShowRouteDialog(false)} onGenerate={generateDailyLog} />
			)}

			{mode === "edit" && selectedEvent && (
				<div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedEventId(null)}>
					<section aria-labelledby="key-point-dialog-title" aria-modal="true" className="event-dialog" role="dialog">
						<div className="dialog-heading">
							<div>
								<span className="form-label">Key point / {selectedEvent.start}</span>
								<h2 id="key-point-dialog-title">Edit details</h2>
							</div>
							<button aria-label="Close key point dialog" className="dialog-close" onClick={() => setSelectedEventId(null)} type="button">×</button>
						</div>
						<form className="event-form" onSubmit={(event) => { event.preventDefault(); updateTimelineDetails(selectedEvent.id, eventDraft.country.trim(), eventDraft.city.trim(), eventDraft.note.trim()); }}>
							<label htmlFor="event-country">Country<input autoFocus id="event-country" value={eventDraft.country} onChange={(event) => setEventDraft((current) => ({ ...current, country: event.target.value }))} /></label>
							<label htmlFor="event-city">City<input id="event-city" value={eventDraft.city} onChange={(event) => setEventDraft((current) => ({ ...current, city: event.target.value }))} /></label>
							<label htmlFor="event-action">What to do<input id="event-action" value={eventDraft.note} onChange={(event) => setEventDraft((current) => ({ ...current, note: event.target.value }))} /></label>
							<div className="dialog-actions">
								<button className="dialog-cancel" onClick={() => setSelectedEventId(null)} type="button">Cancel</button>
								<button className="dialog-submit" type="submit">Save details <span>→</span></button>
							</div>
						</form>
					</section>
				</div>
			)}
		</main>
	);
}


