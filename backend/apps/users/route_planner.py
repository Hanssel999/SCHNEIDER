from math import asin, cos, radians, sin, sqrt
from json import loads
from urllib.parse import quote
from urllib.request import Request, urlopen


DRIVING_SPEED_MPH = 55
FUEL_INTERVAL_MILES = 1000
FUEL_STOP_HOURS = 0.5
SERVICE_STOP_HOURS = 1
CYCLE_LIMIT_HOURS = 70


def distance_miles(start, end):
    earth_radius_miles = 3958.8
    lat_one, lon_one = radians(float(start[0])), radians(float(start[1]))
    lat_two, lon_two = radians(float(end[0])), radians(float(end[1]))
    delta_lat = lat_two - lat_one
    delta_lon = lon_two - lon_one
    haversine = sin(delta_lat / 2) ** 2 + cos(lat_one) * cos(lat_two) * sin(delta_lon / 2) ** 2
    return 2 * earth_radius_miles * asin(sqrt(haversine))


def format_time(minutes):
    bounded = min(1440, max(0, round(minutes)))
    return f"{bounded // 60:02d}:{bounded % 60:02d}"


def routed_geometry(points):
    coordinates = ";".join(f"{float(point[1])},{float(point[0])}" for point in points)
    url = f"https://router.project-osrm.org/route/v1/driving/{quote(coordinates, safe=';,') }?overview=full&geometries=geojson"
    try:
        request = Request(url, headers={"User-Agent": "SchneiderFleet/1.0"})
        with urlopen(request, timeout=8) as response:
            route = loads(response.read().decode("utf-8"))["routes"][0]
        geometry = [[latitude, longitude] for longitude, latitude in route["geometry"]["coordinates"]]
        return route["distance"] / 1609.344, geometry
    except Exception:
        return sum(distance_miles(points[index][:2], points[index + 1][:2]) for index in range(len(points) - 1)), [[float(point[0]), float(point[1])] for point in points]


def point_at_distance(geometry, target_miles):
    remaining = max(0, target_miles)
    for start, end in zip(geometry, geometry[1:]):
        segment_miles = distance_miles(start, end)
        if segment_miles >= remaining:
            fraction = remaining / segment_miles if segment_miles else 0
            return [
                float(start[0]) + (float(end[0]) - float(start[0])) * fraction,
                float(start[1]) + (float(end[1]) - float(start[1])) * fraction,
            ]
        remaining -= segment_miles
    return [float(geometry[-1][0]), float(geometry[-1][1])] if geometry else None


def add_daily_event(day_events, event_id, status, start, end, location, city, note):
    day_events.append({"id": event_id, "status": status, "start": format_time(start), "end": format_time(end), "location": location, "country": "", "city": city, "note": note})
    return event_id + 1


def attach_event_locations(daily_logs, points):
    location_by_name = {point[2]: (float(point[0]), float(point[1])) for point in points}
    last_coordinates = (float(points[0][0]), float(points[0][1]))
    for daily_log in daily_logs:
        for event in daily_log["events"]:
            coordinates = None
            if event.get("latitude") is not None and event.get("longitude") is not None:
                coordinates = (float(event["latitude"]), float(event["longitude"]))
            if coordinates is None:
                coordinates = location_by_name.get(event["city"])
            if coordinates is None:
                coordinates = last_coordinates
            event["latitude"], event["longitude"] = coordinates
            last_coordinates = coordinates


def daily_driving_miles(events):
    return round(sum(
        (to_minutes(event["end"]) - to_minutes(event["start"])) / 60 * DRIVING_SPEED_MPH
        for event in events
        if event["status"] == "Driving"
    ), 1)


def to_minutes(value):
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)


def rollover_day(daily_logs, day_events, day_number, event_id, minute):
    if minute < 1440:
        event_id = add_daily_event(day_events, event_id, "Off duty", minute, 1440, "Rest break", "", "Off-duty rest")
        day_events[-1]["auto_rest"] = True
    daily_logs.append({"day": day_number, "date_label": f"Day {day_number}", "events": day_events})
    return day_number + 1, event_id, [{"id": event_id, "status": "Off duty", "start": "00:00", "end": "06:00", "location": "Rest break", "country": "", "city": "", "note": "Off-duty rest", "auto_rest": True}], 360


def plan_route(data):
    points = [
        (data["current_latitude"], data["current_longitude"], data["current_location"]),
        (data["pickup_latitude"], data["pickup_longitude"], data["pickup_location"]),
        (data["dropoff_latitude"], data["dropoff_longitude"], data["dropoff_location"]),
    ]
    if any(point[0] is None or point[1] is None for point in points):
        raise ValueError("Select each location from the city suggestions so its geolocation can be used.")

    total_distance, geometry = routed_geometry(points)
    driving_hours = total_distance / DRIVING_SPEED_MPH
    service_hours = SERVICE_STOP_HOURS * 2
    fuel_stops = int(total_distance // FUEL_INTERVAL_MILES)
    total_duty_hours = driving_hours + service_hours + fuel_stops * FUEL_STOP_HOURS
    current_cycle = float(data["current_cycle_used"])
    daily_logs = []
    day_number = 1
    event_id = 1
    day_events = [{"id": event_id, "status": "Off duty", "start": "00:00", "end": "06:00", "location": points[0][2], "country": "", "city": points[0][2], "note": "Rest before dispatch"}]
    event_id += 1
    minute = 360
    driving_today = 0
    duty_today = 0
    cycle_hours = current_cycle
    miles_since_fuel = 0
    distance_travelled = 0
    fuel_count = 0

    def rollover_if_needed(duration_hours, driving=False):
        nonlocal day_number, event_id, day_events, minute, driving_today, duty_today, cycle_hours
        if cycle_hours + duration_hours > CYCLE_LIMIT_HOURS:
            if minute == 360 and day_events and all(event.get("auto_rest") for event in day_events):
                day_events = []
                minute = 0
            if minute < 1440:
                event_id = add_daily_event(day_events, event_id, "Sleeper", minute, 1440, "Cycle reset", "", "Sleeper berth · 34-hour restart")
            daily_logs.append({"day": day_number, "date_label": f"Day {day_number}", "events": day_events})
            day_number += 1
            day_events = [{"id": event_id, "status": "Sleeper", "start": "00:00", "end": "24:00", "location": "Cycle reset", "country": "", "city": "", "note": "Sleeper berth · 34-hour restart"}]
            event_id += 1
            daily_logs.append({"day": day_number, "date_label": f"Day {day_number}", "events": day_events})
            day_number += 1
            day_events = [{"id": event_id, "status": "Sleeper", "start": "00:00", "end": "10:00", "location": "Cycle reset", "country": "", "city": "", "note": "Sleeper berth · 34-hour restart"}]
            event_id += 1
            minute = 600
            driving_today = 0
            duty_today = 0
            cycle_hours = 0
        if minute + duration_hours * 60 > 1440 or duty_today + duration_hours > 14 or (driving and driving_today + duration_hours > 11):
            day_number, event_id, day_events, minute = rollover_day(daily_logs, day_events, day_number, event_id, minute)
            driving_today = 0
            duty_today = 0

    for leg_index in range(2):
        start, end = points[leg_index], points[leg_index + 1]
        leg_distance = distance_miles(start[:2], end[:2])
        leg_distance *= total_distance / max(0.1, sum(distance_miles(points[index][:2], points[index + 1][:2]) for index in range(2)))
        while leg_distance > 0.01:
            miles_to_fuel = FUEL_INTERVAL_MILES - miles_since_fuel
            available_drive_hours = min(
                11 - driving_today,
                14 - duty_today,
                (1440 - minute) / 60,
            )
            if available_drive_hours <= 0.01:
                day_number, event_id, day_events, minute = rollover_day(daily_logs, day_events, day_number, event_id, minute)
                driving_today = 0
                duty_today = 0
                continue
            drive_miles = min(leg_distance, miles_to_fuel, available_drive_hours * DRIVING_SPEED_MPH)
            drive_hours = drive_miles / DRIVING_SPEED_MPH
            rollover_if_needed(drive_hours, driving=True)
            event_id = add_daily_event(day_events, event_id, "Driving", minute, minute + drive_hours * 60, f"{start[2]} to {end[2]}", end[2], "En route")
            minute += drive_hours * 60
            driving_today += drive_hours
            duty_today += drive_hours
            cycle_hours += drive_hours
            leg_distance -= drive_miles
            miles_since_fuel += drive_miles
            distance_travelled += drive_miles
            if miles_since_fuel >= FUEL_INTERVAL_MILES - 0.01 and leg_distance > 0.01:
                rollover_if_needed(FUEL_STOP_HOURS)
                event_id = add_daily_event(day_events, event_id, "On duty", minute, minute + FUEL_STOP_HOURS * 60, "Fuel stop", end[2], "Fueling checkpoint")
                fuel_coordinates = point_at_distance(geometry, distance_travelled)
                if fuel_coordinates:
                    day_events[-1]["latitude"], day_events[-1]["longitude"] = fuel_coordinates
                day_events[-1]["stop_type"] = "fuel"
                minute += FUEL_STOP_HOURS * 60
                duty_today += FUEL_STOP_HOURS
                cycle_hours += FUEL_STOP_HOURS
                miles_since_fuel = 0
                fuel_count += 1
        rollover_if_needed(SERVICE_STOP_HOURS)
        service_note = "Pickup service · 1 hour" if leg_index == 0 else "Drop-off service · 1 hour"
        event_id = add_daily_event(day_events, event_id, "On duty", minute, minute + 60, end[2], end[2], service_note)
        minute += 60
        duty_today += 1
        cycle_hours += 1

    if minute < 1440:
        add_daily_event(day_events, event_id, "Off duty", minute, 1440, points[-1][2], points[-1][2], "Rest")
    daily_logs.append({"day": day_number, "date_label": f"Day {day_number}", "events": day_events})
    attach_event_locations(daily_logs, points)
    for daily_log in daily_logs:
        daily_log["driver_miles"] = daily_driving_miles(daily_log["events"])
        daily_log["truck_miles"] = daily_log["driver_miles"]
    return {"distance_miles": round(total_distance, 1), "cycle_after_hours": round(current_cycle + total_duty_hours, 1), "fuel_stops": fuel_count, "timeline": daily_logs[0]["events"], "daily_logs": daily_logs, "geometry": geometry}