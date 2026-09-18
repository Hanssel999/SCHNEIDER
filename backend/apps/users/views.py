from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from common.responses import success_response

from .models import DriverRouteIntake
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
        return success_response(DriverRouteIntakeSerializer(intake).data if intake else None)

    def post(self, request):
        intake = DriverRouteIntake.objects.order_by("-updated_at").first()
        serializer = DriverRouteIntakeSerializer(intake, data=request.data)
        serializer.is_valid(raise_exception=True)
        intake = serializer.save()
        return success_response(DriverRouteIntakeSerializer(intake).data, status.HTTP_201_CREATED)
