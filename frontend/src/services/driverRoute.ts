import { apiRequest } from "./api";

export type DriverRouteIntake = {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
  current_latitude: number | null;
  current_longitude: number | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  dropoff_latitude: number | null;
  dropoff_longitude: number | null;
};

export type GeneratedRoute = {
  distance_miles: number;
  cycle_after_hours: number;
  fuel_stops: number;
  timeline: Array<{ id: number; status: string; start: string; end: string; location: string; country: string; city: string; note: string; latitude?: number; longitude?: number }>;
  daily_logs: Array<{ day: number; date_label: string; events: GeneratedRoute["timeline"]; driver_miles: number; truck_miles: number }>;
  geometry: Array<[number, number]>;
};

export type DriverRouteResponse = { intake: DriverRouteIntake; route: GeneratedRoute };

export const driverRouteService = {
  get() {
    return apiRequest<{ intake: DriverRouteIntake | null; route: GeneratedRoute | null }>("/auth/driver-route/");
  },
  save(payload: DriverRouteIntake) {
    return apiRequest<DriverRouteResponse>("/auth/driver-route/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};