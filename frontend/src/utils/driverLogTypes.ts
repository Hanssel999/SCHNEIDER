export type DriverLog = {
  driverNumber: string;
  date: string;
  initials: string;
  signature: string;
  vehicleNumber: string;
  trailerNumber: string;
  coDriver: string;
  homeTerminal: string;
  shipper: string;
  commodity: string;
  loadNumber: string;
  driverMiles: number;
  truckMiles: number;
  dutyHours: Record<string, number>;
};

export type TimelineEvent = {
  id: number;
  status: string;
  start: string;
  end: string;
  location: string;
  country: string;
  city: string;
  note: string;
};

export const dutyRows = ["Off duty", "Sleeper", "Driving", "On duty"];
export const hourLabels = Array.from({ length: 25 }, (_, index) => index);
