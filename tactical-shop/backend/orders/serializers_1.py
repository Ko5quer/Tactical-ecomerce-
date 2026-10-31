from rest_framework import serializers

from products.serializers import ProductSerializer

from .models import Order, OrderItem

# Payment methods customers may choose at checkout.
# When you connect an online gateway, add "card" here.
ENABLED_PAYMENT_METHODS = ["cod", "eft"]


class CheckoutSerializer(serializers.Serializer):
    """Validates what the checkout page sends."""

    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30)
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(
        max_length=20, required=False, allow_blank=True, default=""
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    payment_method = serializers.ChoiceField(
        choices=ENABLED_PAYMENT_METHODS,
        error_messages={"invalid_choice": "That payment method isn't available yet."},
    )


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "price", "created_at"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
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
