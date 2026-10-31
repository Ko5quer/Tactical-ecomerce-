import re

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User

NAME_RE = re.compile(r"^[^\W\d_](?:[^\W\d_]|[ '.\-])*$")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, max_length=128)

    class Meta:
        model = User
        fields = ["user_id", "email", "first_name", "last_name", "password"]
        read_only_fields = ["user_id"]
        extra_kwargs = {
            "first_name": {"required": True, "allow_blank": False},
            "last_name": {"required": False, "allow_blank": True},
        }

    def _check_name(self, value):
        if value and not NAME_RE.match(value):
            raise serializers.ValidationError(
                "Only letters, spaces, apostrophes, full stops and hyphens are allowed."
            )
        return value

    def validate_first_name(self, value):
        return self._check_name(value)

    def validate_last_name(self, value):
        return self._check_name(value)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_id", "email", "first_name", "last_name"]
