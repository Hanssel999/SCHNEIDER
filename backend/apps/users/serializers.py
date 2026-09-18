from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from rest_framework import serializers

from .models import DriverRouteIntake, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "role", "is_active")


class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "password", "password_confirm", "role")

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs


class SignInSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class DriverRouteIntakeSerializer(serializers.ModelSerializer):
    coordinate_fields = (
        "current_latitude",
        "current_longitude",
        "pickup_latitude",
        "pickup_longitude",
        "dropoff_latitude",
        "dropoff_longitude",
    )

    class Meta:
        model = DriverRouteIntake
        fields = ("current_location", "pickup_location", "dropoff_location", "current_cycle_used", "current_latitude", "current_longitude", "pickup_latitude", "pickup_longitude", "dropoff_latitude", "dropoff_longitude")
        read_only_fields = ("route_distance_miles", "generated_timeline", "generated_daily_logs", "route_geometry")

    def to_internal_value(self, data):
        normalized = data.copy()
        for field in self.coordinate_fields:
            value = normalized.get(field)
            if value in (None, ""):
                continue
            try:
                normalized[field] = str(
                    Decimal(str(value)).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP),
                )
            except (InvalidOperation, ValueError, TypeError):
                pass
        return super().to_internal_value(normalized)

    def validate_current_cycle_used(self, value):
        if value < 0 or value > 70:
            raise serializers.ValidationError("Cycle used must be between 0 and 70 hours.")
        return value
