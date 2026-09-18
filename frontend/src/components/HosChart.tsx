import { PointerEvent, useRef } from "react";
import { TimelineEvent, dutyRows, hourLabels } from "./driverLogTypes";
import { toMinutes } from "../utils";

type HosChartProps = {
  events: TimelineEvent[];
  editable?: boolean;
  onUpdate?: (id: number, field: "start" | "end", minutes: number, status: string) => void;
};

export function HosChart({ events, editable = false, onUpdate }: HosChartProps) {
  const width = 1200;
  const height = 315;
  const left = 122;
  const right = 12;
  const top = 34;
  const bottom = 88;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const rowHeight = chartHeight / 4;
  const x = (minutes: number) => left + (minutes / 1440) * chartWidth;
  const y = (row: number) => top + row * rowHeight + rowHeight / 2;
  const rowForStatus = (status: string) => dutyRows.indexOf(status);
  const orderedEvents = [...events].sort((leftEvent, rightEvent) => toMinutes(leftEvent.start) - toMinutes(rightEvent.start));
  const chartKeypoints = orderedEvents.map((event) => ({ event, field: "start" as const }));
  const drivingRemarks = orderedEvents.slice(1).flatMap((event, index) => {
    const previousEvent = orderedEvents[index];
    return event.status === "Driving" || previousEvent.status === "Driving"
      ? [{ event, label: event.status === "Driving" ? event.location : previousEvent.location, note: event.status === "Driving" ? event.note : previousEvent.note }]
      : [];
  });
  const dragRef = useRef<{ event: TimelineEvent; field: "start" | "end" } | null>(null);

  const updatePointAt = (svg: SVGSVGElement, clientX: number, clientY: number, event: TimelineEvent, field: "start" | "end") => {
    const bounds = svg.getBoundingClientRect();
    const svgX = ((clientX - bounds.left) / bounds.width) * width;
    const minutes = Math.round(Math.max(0, Math.min(1440, ((svgX - left) / chartWidth) * 1440)) / 15) * 15;
    const svgY = ((clientY - bounds.top) / bounds.height) * height;
    const row = dutyRows.reduce((closest, _, index) => Math.abs(y(index) - svgY) < Math.abs(y(closest) - svgY) ? index : closest, 0);
    onUpdate?.(event.id, field, minutes, dutyRows[row]);
  };

  const updatePoint = (pointerEvent: PointerEvent<SVGCircleElement>, event: TimelineEvent, field: "start" | "end") => {
    if (!editable || !onUpdate || (pointerEvent.type !== "pointerdown" && pointerEvent.buttons !== 1)) return;
    const target = pointerEvent.currentTarget as SVGSVGElement | SVGCircleElement;
    const svg = (target.ownerSVGElement ?? target) as SVGSVGElement;
    pointerEvent.stopPropagation();
    if (pointerEvent.type === "pointerdown") {
      pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
      dragRef.current = { event, field };
      const handleMove = (nativeEvent: globalThis.PointerEvent) => {
        if (nativeEvent.buttons === 1 && dragRef.current) updatePointAt(svg, nativeEvent.clientX, nativeEvent.clientY, dragRef.current.event, dragRef.current.field);
      };
      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
    }
    updatePointAt(svg, pointerEvent.clientX, pointerEvent.clientY, event, field);
  };

  const path = orderedEvents.length > 0 ? orderedEvents.reduce((chartPath, event, index) => {
    const startX = x(toMinutes(event.start));
    const eventY = y(rowForStatus(event.status));
    if (index === 0) return `M${startX},${eventY}`;
    const previousY = y(rowForStatus(orderedEvents[index - 1].status));
    return `${chartPath} L${startX},${previousY} L${startX},${eventY}`;
  }, "") : "";
  const lastEvent = orderedEvents[orderedEvents.length - 1];
  const disabledPath = lastEvent ? `M${x(toMinutes(lastEvent.start))},${y(rowForStatus(lastEvent.status))} L${x(1440)},${y(rowForStatus(lastEvent.status))}` : "";

  return (
    <div className="hos-chart-wrap">
      <svg aria-label="Hours of service line chart with 15 minute intervals" className="hos-chart" role="img" viewBox={`0 0 ${width} ${height}`}>
        <rect className="chart-surface" height={chartHeight} width={chartWidth} x={left} y={top} />
        {Array.from({ length: 97 }, (_, index) => <line className={index % 4 === 0 ? "chart-hour-line" : "chart-quarter-line"} key={`vertical-${index}`} x1={left + (index / 96) * chartWidth} x2={left + (index / 96) * chartWidth} y1={top} y2={top + chartHeight} />)}
        {Array.from({ length: 5 }, (_, index) => <line className="chart-row-line" key={`horizontal-${index}`} x1={left} x2={left + chartWidth} y1={top + index * rowHeight} y2={top + index * rowHeight} />)}
        {dutyRows.map((duty, index) => <text className={`chart-row-label chart-label-${index}`} key={duty} x="6" y={y(index) + 3}>{`${index + 1}: ${duty}`}</text>)}
        {dutyRows.map((duty, index) => <text className="chart-row-subtitle" key={`${duty}-subtitle`} x="6" y={y(index) + 14}>{duty === "Sleeper" ? "berth" : duty === "On duty" ? "(not driving)" : ""}</text>)}
        {hourLabels.map((hour) => <text className="chart-hour-label" key={`label-${hour}`} textAnchor="middle" x={x(hour * 60)} y="21">{hour === 0 ? "Midnight" : hour === 12 ? "noon" : hour === 24 ? "Midnight" : hour}</text>)}
        <line className="chart-bottom-ruler" x1={left} x2={left + chartWidth} y1={top + chartHeight + 18} y2={top + chartHeight + 18} />
        {Array.from({ length: 97 }, (_, index) => <line className={index % 4 === 0 ? "chart-long-tick" : "chart-quarter-tick"} key={`tick-${index}`} x1={left + (index / 96) * chartWidth} x2={left + (index / 96) * chartWidth} y1={top + chartHeight + 18} y2={top + chartHeight + (index % 4 === 0 ? 39 : 30)} />)}
        {hourLabels.map((hour) => <text className="chart-bottom-label" key={`bottom-label-${hour}`} textAnchor="middle" x={x(hour * 60)} y={top + chartHeight + 13}>{hour === 0 ? "Midnight" : hour === 12 ? "noon" : hour === 24 ? "Midnight" : hour}</text>)}
        <text className="chart-remarks-label" x="6" y={height - 17}>REMARKS</text>
        {drivingRemarks.map(({ event, label, note }, index) => { const anchorX = x(toMinutes(event.start)); const remarkY = height - 42 - (index % 2) * 30; return <g className="chart-remark-callout" key={`remark-${event.id}`}><path d={`M${anchorX},${top + chartHeight + 40} L${anchorX},${remarkY - 12}`} /><text textAnchor="middle" transform={`translate(${anchorX},${remarkY}) rotate(-42)`}><tspan x="0" dy="0">{label}</tspan><tspan x="0" dy="15">{note}</tspan></text></g>; })}
        {path && <path className="chart-duty-path" d={path} />}
        {disabledPath && <path className="chart-disabled-path" d={disabledPath} />}
        {chartKeypoints.map(({ event, field }) => <circle className={`chart-event-dot chart-dot-${event.status.toLowerCase().replace(" ", "-")} ${editable ? "chart-keypoint" : ""}`} cx={x(toMinutes(event.start))} cy={y(rowForStatus(event.status))} onPointerMove={(pointerEvent) => updatePoint(pointerEvent, event, field)} onPointerDown={(pointerEvent) => updatePoint(pointerEvent, event, field)} r={editable ? "6" : "4"} key={event.id}><title>{`${event.status} transition at ${event.start} · ${event.location}`}</title></circle>)}
      </svg>
    </div>
  );
}
