from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .repositories import UserRepository


class AuthenticationService:
    def register(self, validated_data):
        return UserRepository.create_user(**validated_data)

    def sign_in(self, email, password):
        user = authenticate(username=email, password=password)
        if user is None:
            return None
        refresh = RefreshToken.for_user(user)
        return {"access": str(refresh.access_token), "refresh": str(refresh), "user": user}
