import { TimelineEvent, dutyRows } from "./driverLogTypes";

type ApiError = Record<string, unknown>;

export function formatDate(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getDutyHours(events: TimelineEvent[]) {
  return dutyRows.reduce<Record<string, number>>((hours, duty) => {
    hours[duty] = events
      .filter((event) => event.status === duty)
      .reduce((total, event) => total + (toMinutes(event.end) - toMinutes(event.start)) / 60, 0);
    return hours;
  }, {});
}

export function formatApiError(error: ApiError) {
  if (typeof error.detail === "string") return error.detail;
  return Object.values(error).flat().join(" ") || "Something went wrong. Please try again.";
}
