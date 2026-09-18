from .models import User


class UserRepository:
    @staticmethod
    def create_user(**validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)

    @staticmethod
    def get_by_email(email):
        return User.objects.filter(email__iexact=email).first()
