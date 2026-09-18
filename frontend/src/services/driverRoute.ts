import { apiRequest } from "./api";

export type DriverRouteIntake = {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used: number;
};

export const driverRouteService = {
  get() {
    return apiRequest<{ intake: DriverRouteIntake | null }>("/auth/driver-route/").then((response) => response.intake);
  },
  save(payload: DriverRouteIntake) {
    return apiRequest<DriverRouteIntake>("/auth/driver-route/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};