
from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import ( api_view, permission_classes,)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order, OrderItem
from .serializers import OrderSerializer

from carts.models import Cart
from products.models import Product


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_orders(request):
    orders = (
        Order.objects
        .filter(user=request.user)
        .prefetch_related("order_items__product")
        .order_by("-created_at")
    )

    serializer = OrderSerializer(orders, many=True)

    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_order(request, order_id):
    order = get_object_or_404(
        Order.objects.prefetch_related("order_items__product"),
        pk=order_id,
        user=request.user,
    )

    serializer = OrderSerializer(order)

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def checkout(request):
    cart = get_object_or_404(
        Cart.objects.select_for_update(),
        user=request.user,
    )

    cart_items = list(
        cart.cart_items.select_related("product").all()
    )

    if not cart_items:
        return Response(
            {"error": "Your cart is empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    product_ids = sorted({
        item.product_id for item in cart_items
    })

    products = Product.objects.select_for_update().filter(
        pk__in=product_ids
    ).order_by("pk")

    products_by_id = {
        product.pk: product for product in products
    }
    for item in cart_items:
        product = products_by_id[item.product_id]

        if product.current_stock < item.quantity:
            return Response(
                {
                    "error": (
                        f"Insufficient stock for "
                        f"{product.product_name}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    total = sum(
        (
            products_by_id[item.product_id].product_price
            * item.quantity
            for item in cart_items
        ),
        Decimal("0.00"),
    )
    order = Order.objects.create(
        user=request.user,
        total=total,
        status="pending",
    )
    for item in cart_items:
        product = products_by_id[item.product_id]

        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=item.quantity,
            price=product.product_price,
        )

        product.current_stock -= item.quantity
        product.save(update_fields=["current_stock"])

    # Empty the cart only after creating the order items.
    cart.cart_items.all().delete()

    serializer = OrderSerializer(order)

    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED,
    )
