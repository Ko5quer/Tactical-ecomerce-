import re

from rest_framework import serializers

from products.serializers import ProductSerializer

from .models import (
    BankAccount,
    Order,
    OrderItem,
    PaymentMethod,
    ensure_default_payment_methods,
)

# letters (any language), spaces, apostrophes, full stops and hyphens; must start with a letter
NAME_RE = re.compile(r"^[^\W\d_](?:[^\W\d_]|[ '.\-])*$")
PHONE_RE = re.compile(r"^\+?[0-9 ()\-]+$")
POSTAL_RE = re.compile(r"^[A-Za-z0-9 \-]{3,10}$")


def _has_control_chars(value, allow_newlines=False):
    allowed = {"\n", "\r"} if allow_newlines else set()
    return any(ord(c) < 32 and c not in allowed for c in value)


class CheckoutSerializer(serializers.Serializer):
    """Validates what the checkout page sends. Every message here is shown
    to the customer, so they are written in plain English."""

    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(
        max_length=20, required=False, allow_blank=True, default=""
    )
    notes = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=""
    )
    payment_method = serializers.CharField(max_length=20)

    def validate_full_name(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Enter your full name.")
        if not NAME_RE.match(value):
            raise serializers.ValidationError(
                "Name can only contain letters, spaces, apostrophes, full stops and hyphens."
            )
        return value

    def validate_phone(self, value):
        digits = re.sub(r"\D", "", value)
        if not PHONE_RE.match(value) or not 9 <= len(digits) <= 15:
            raise serializers.ValidationError(
                "Enter a valid phone number (9 to 15 digits, for example 082 123 4567)."
            )
        return value

    def validate_address(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Enter your full street address.")
        if not re.search(r"[^\W\d_]", value):
            raise serializers.ValidationError("The address must contain a street or place name.")
        if _has_control_chars(value):
            raise serializers.ValidationError("The address contains invalid characters.")
        return value

    def validate_city(self, value):
        if not NAME_RE.match(value):
            raise serializers.ValidationError("Enter a valid city or town name.")
        return value

    def validate_postal_code(self, value):
        if value and not POSTAL_RE.match(value):
            raise serializers.ValidationError(
                "Enter a valid postal code (3 to 10 letters, numbers, spaces or hyphens)."
            )
        return value

    def validate_notes(self, value):
        if _has_control_chars(value, allow_newlines=True):
            raise serializers.ValidationError("The notes contain invalid characters.")
        return value

    def validate_payment_method(self, value):
        ensure_default_payment_methods()
        if not PaymentMethod.objects.filter(code=value, is_enabled=True).exists():
            raise serializers.ValidationError("That payment method isn't available.")
        return value


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ["code", "label", "description", "is_enabled"]


class BankAccountSerializer(serializers.ModelSerializer):
    account_type = serializers.CharField(source="get_account_type_display")

    class Meta:
        model = BankAccount
        fields = [
            "bank_name",
            "account_holder",
            "account_number",
            "branch_code",
            "branch_name",
            "account_type",
            "swift_code",
            "proof_of_payment_email",
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "price", "created_at"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    reference = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = [
            "id",
            "reference",
            "total",
            "status",
            "payment_method",
            "payment_status",
            "full_name",
            "phone",
            "address",
            "city",
            "postal_code",
            "notes",
            "order_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
