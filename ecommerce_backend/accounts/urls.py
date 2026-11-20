from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views
from .password_reset import (
    password_reset_request,
    password_reset_confirm,
)
urlpatterns = [
    path("register/", views.register, name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", views.me, name="me"),
    path("password-reset/", password_reset_request),
    path("password-reset/confirm/", password_reset_confirm),
]
