
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Cart, CartItem
from products.models import Product
from .serializers import CartSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart, created = Cart.objects.get_or_create(user=request.user)

    serializer = CartSerializer(cart)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def add_cartItem(request):
    product_id = request.data.get("product_id")
    quantity = request.data.get("quantity", 1)

    if product_id is None:
        return Response(
            {"error": "product_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        if isinstance(quantity, bool):
            raise ValueError

        quantity = int(quantity)

        if quantity < 1:
            raise ValueError

    except (TypeError, ValueError):
        return Response(
            {"error": "quantity must be a positive integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    product = get_object_or_404(Product, pk=product_id)

    cart, created = Cart.objects.get_or_create(user=request.user)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={"quantity": quantity},
    )

    if not created:
        item.quantity += quantity
        item.save(update_fields=["quantity", "updated_at"])

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
    quantity = request.data.get("quantity")

    try:
        if isinstance(quantity, bool):
            raise ValueError

        quantity = int(quantity)

        if quantity < 1:
            raise ValueError

    except (TypeError, ValueError):
        return Response(
            {"error": "quantity must be a positive integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cart = get_object_or_404(Cart, user=request.user)

    item = get_object_or_404(
        CartItem,
        pk=item_id,
        cart=cart,
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

    item = get_object_or_404(
        CartItem,
        pk=item_id,
        cart=cart,
    )

    item.delete()

    return Response(
        {"message": "Product removed from cart"},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
    return Response(
        {"message": "Checkout is not implemented yet"},
        status=status.HTTP_501_NOT_IMPLEMENTED,
    )
