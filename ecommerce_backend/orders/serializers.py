
from rest_framework import serializers

from .models import Order, OrderItem
from products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "quantity",
            "price",
            "created_at",
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "total",
            "status",
            "order_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
