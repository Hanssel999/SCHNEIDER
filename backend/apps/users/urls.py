from django.urls import path

from .views import DriverRouteIntakeView, SignInView, SignUpView

urlpatterns = [
    path("signin/", SignInView.as_view(), name="sign-in"),
    path("signup/", SignUpView.as_view(), name="sign-up"),
    path("driver-route/", DriverRouteIntakeView.as_view(), name="driver-route"),
]
