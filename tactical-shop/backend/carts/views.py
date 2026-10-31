from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from products.models import Product

from .models import Cart, CartItem
from .serializers import CartSerializer


def _bad_request(message):
    return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)


def _parse_quantity(raw, default=None):
    """Returns a positive int or None if invalid."""
    if raw is None:
        raw = default
    if raw is None or isinstance(raw, bool):
        return None
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return None
    return value if value >= 1 else None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)
    serializer = CartSerializer(cart, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def add_cartItem(request):
    product_id = request.data.get("product_id")
    if product_id is None or isinstance(product_id, bool):
        return _bad_request("product_id is required")
    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return _bad_request("product_id must be a number")

    quantity = _parse_quantity(request.data.get("quantity"), default=1)
    if quantity is None:
        return _bad_request("quantity must be a positive whole number")

    product = get_object_or_404(Product, pk=product_id)

    if product.current_stock < 1:
        return _bad_request(f"{product.product_name} is out of stock.")

    cart, created = Cart.objects.get_or_create(user=request.user)

    item = CartItem.objects.filter(cart=cart, product=product).first()
    already_in_cart = item.quantity if item else 0

    if already_in_cart + quantity > product.current_stock:
        left = product.current_stock - already_in_cart
        if left <= 0:
            return _bad_request(
                f"You already have all {product.current_stock} of {product.product_name} in your cart."
            )
        return _bad_request(
            f"Only {product.current_stock} of {product.product_name} in stock "
            f"(you can add {left} more)."
        )

    if item:
        item.quantity += quantity
        item.save(update_fields=["quantity", "updated_at"])
    else:
        item = CartItem.objects.create(cart=cart, product=product, quantity=quantity)

    return Response(
        {
            "message": "Product added to cart",
            "product_id": product.pk,
            "quantity": item.quantity,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def cartItem_quantity(request, item_id):
    quantity = _parse_quantity(request.data.get("quantity"))
    if quantity is None:
        return _bad_request("quantity must be a positive whole number")

    cart = get_object_or_404(Cart, user=request.user)
    item = get_object_or_404(
        CartItem.objects.select_related("product"), pk=item_id, cart=cart
    )

    if quantity > item.product.current_stock:
        return _bad_request(
            f"Only {item.product.current_stock} of {item.product.product_name} in stock."
        )

    item.quantity = quantity
    item.save(update_fields=["quantity", "updated_at"])

    return Response(
        {
            "message": "Cart item quantity updated",
            "item_id": item.id,
            "quantity": item.quantity,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_cartItem(request, item_id):
    cart = get_object_or_404(Cart, user=request.user)
    item = get_object_or_404(CartItem, pk=item_id, cart=cart)
    item.delete()
    return Response(
        {"message": "Product removed from cart"},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    # Placeholder kept so carts/urls.py still works. The real checkout is
    # POST /api/orders/checkout/
    return Response(
        {"message": "Use /api/orders/checkout/ to place an order."},
        status=status.HTTP_501_NOT_IMPLEMENTED,
    )
