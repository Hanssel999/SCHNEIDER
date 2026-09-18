from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from common.responses import success_response

from .models import DriverRouteIntake
from .route_planner import plan_route
from .serializers import DriverRouteIntakeSerializer, SignInSerializer, SignUpSerializer, UserSerializer
from .services import AuthenticationService


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
    permission_classes = (AllowAny,)

    def get(self, request):
        intake = DriverRouteIntake.objects.order_by("-updated_at").first()
        route = None
        if intake:
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
        intake = DriverRouteIntake.objects.order_by("-updated_at").first()
        serializer = DriverRouteIntakeSerializer(intake, data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            route = plan_route(serializer.validated_data)
        except ValueError as error:
            return success_response({"detail": str(error)}, status.HTTP_400_BAD_REQUEST)
        intake = serializer.save(route_distance_miles=route["distance_miles"], generated_timeline=route["timeline"], generated_daily_logs=route["daily_logs"], route_geometry=route["geometry"])
        return success_response({"intake": DriverRouteIntakeSerializer(intake).data, "route": route}, status.HTTP_201_CREATED)
