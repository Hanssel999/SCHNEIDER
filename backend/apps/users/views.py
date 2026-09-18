from rest_framework import status
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.views import APIView

from common.responses import success_response

from .models import DriverRouteIntake
from .route_planner import plan_route
from .serializers import DriverRouteIntakeSerializer, SignInSerializer, SignUpSerializer, UserSerializer
from .services import AuthenticationService


class IsDriver(BasePermission):
    message = "Only driver accounts can access the driver log."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "driver")


class SignUpView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthenticationService().register(serializer.validated_data)
        return success_response({"message": "Account created successfully.", "user": UserSerializer(user).data}, status.HTTP_201_CREATED)


class SignInView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = SignInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = AuthenticationService().sign_in(**serializer.validated_data)
        if session is None:
            return success_response({"detail": "Invalid email or password."}, status.HTTP_401_UNAUTHORIZED)
        session["user"] = UserSerializer(session["user"]).data
        return success_response(session)


class DriverRouteIntakeView(APIView):
    permission_classes = (IsDriver,)

    def get(self, request):
        intake = DriverRouteIntake.objects.filter(user=request.user).first()
        route = None
        if intake:
            stored_daily_logs = intake.generated_daily_logs
            first_day_events = stored_daily_logs[0].get("events", []) if stored_daily_logs else []
            has_work_event = any(event.get("status") in ("Driving", "On duty") for event in first_day_events)
            has_legacy_fuel_event = any(
                event.get("note") == "Fueling checkpoint" and event.get("stop_type") != "fuel"
                for daily_log in stored_daily_logs
                for event in daily_log.get("events", [])
            )
            has_legacy_daily_rest = any(
                event.get("location") == "Rest break"
                and event.get("note") == "Sleeper berth"
                for daily_log in stored_daily_logs
                for event in daily_log.get("events", [])
            )
            has_redundant_cycle_rest = any(
                any(event.get("auto_rest") for event in daily_log.get("events", []))
                and any(event.get("location") == "Cycle reset" for event in daily_log.get("events", []))
                for daily_log in stored_daily_logs
            )
            has_legacy_geometry = len(intake.route_geometry) <= 3
            if (first_day_events and not has_work_event) or has_legacy_fuel_event or has_legacy_daily_rest or has_redundant_cycle_rest or has_legacy_geometry:
                try:
                    route = plan_route({
                        "current_latitude": intake.current_latitude,
                        "current_longitude": intake.current_longitude,
                        "current_location": intake.current_location,
                        "pickup_latitude": intake.pickup_latitude,
                        "pickup_longitude": intake.pickup_longitude,
                        "pickup_location": intake.pickup_location,
                        "dropoff_latitude": intake.dropoff_latitude,
                        "dropoff_longitude": intake.dropoff_longitude,
                        "dropoff_location": intake.dropoff_location,
                        "current_cycle_used": intake.current_cycle_used,
                    })
                except ValueError as error:
                    return success_response({"detail": str(error)}, status.HTTP_503_SERVICE_UNAVAILABLE)
            if route is not None:
                return success_response({"intake": DriverRouteIntakeSerializer(intake).data, "route": route, "daily_log": intake.driver_log_data})
            route = {
                "distance_miles": float(intake.route_distance_miles),
                "cycle_after_hours": 0,
                "fuel_stops": sum(1 for event in intake.generated_timeline if event.get("note") == "Fueling checkpoint"),
                "timeline": intake.generated_timeline,
                "daily_logs": intake.generated_daily_logs,
                "geometry": intake.route_geometry,
            }
        return success_response({"intake": DriverRouteIntakeSerializer(intake).data if intake else None, "route": route})

    def post(self, request):
        intake = DriverRouteIntake.objects.filter(user=request.user).first()
        serializer = DriverRouteIntakeSerializer(intake, data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            route = plan_route(serializer.validated_data)
        except ValueError as error:
            return success_response({"detail": str(error)}, status.HTTP_400_BAD_REQUEST)
        intake = serializer.save(
            user=request.user,
            route_distance_miles=route["distance_miles"],
            generated_timeline=route["timeline"],
            generated_daily_logs=route["daily_logs"],
            driver_log_data={},
            route_geometry=route["geometry"],
        )
        return success_response({"intake": DriverRouteIntakeSerializer(intake).data, "route": route}, status.HTTP_201_CREATED)

    def patch(self, request):
        intake = DriverRouteIntake.objects.filter(user=request.user).first()
        if intake is None:
            return success_response({"detail": "Generate a route before saving a daily log."}, status.HTTP_404_NOT_FOUND)

        daily_log = request.data.get("daily_log")
        if not isinstance(daily_log, dict):
            return success_response({"detail": "daily_log must be an object."}, status.HTTP_400_BAD_REQUEST)

        intake.driver_log_data = daily_log
        intake.save(update_fields=("driver_log_data", "updated_at"))
        return success_response({"daily_log": intake.driver_log_data})
