import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

log = logging.getLogger(__name__)
User = get_user_model()


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def password_reset_request(request):
    """Body: {"email": "..."}. Always answers the same, so nobody can use this
    to find out which emails have accounts."""
    email = (request.data.get("email") or "").strip()
    user = User.objects.filter(email__iexact=email, is_active=True).first() if email else None

    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        try:
            send_mail(
                "Reset your password",
                "We got a request to reset your password.\n\n"
                f"Open this link to choose a new one:\n{link}\n\n"
                "If you didn't ask for this, you can ignore this email.",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )
        except Exception:
            log.exception("Could not send password reset email")

    return Response({"message": "If that email has an account, we've sent a reset link."})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Body: {"uid": "...", "token": "...", "new_password": "..."}"""
    invalid = Response({"error": "This reset link is invalid or has expired."}, status=400)

    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(request.data.get("uid", ""))))
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return invalid

    if not default_token_generator.check_token(user, request.data.get("token", "")):
        return invalid

    new_password = request.data.get("new_password") or ""
    try:
        validate_password(new_password, user)
    except ValidationError as e:
        return Response({"new_password": list(e.messages)}, status=400)

    user.set_password(new_password)  # also makes the link single-use
    user.save()
    return Response({"message": "Password updated. You can now log in."})
