from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from carts.models import Cart
from products.models import Product

from .models import (
    BankAccount,
    Order,
    OrderItem,
    PaymentMethod,
    ensure_default_payment_methods,
)
from .serializers import (
    BankAccountSerializer,
    CheckoutSerializer,
    OrderSerializer,
    PaymentMethodSerializer,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_orders(request):
    orders = (
        Order.objects.filter(user=request.user)
        .prefetch_related("order_items__product")
        .order_by("-created_at")
    )
    return Response(OrderSerializer(orders, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_order(request, order_id):
    order = get_object_or_404(
        Order.objects.prefetch_related("order_items__product"),
        pk=order_id,
        user=request.user,
    )
    return Response(OrderSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def checkout(request):
    # 1. validate delivery details + payment method from the checkout page
    details = CheckoutSerializer(data=request.data)
    details.is_valid(raise_exception=True)
    info = details.validated_data
    payment_method = info.pop("payment_method")

    # 2. load the cart
    cart = get_object_or_404(
        Cart.objects.select_for_update(),
        user=request.user,
    )
    cart_items = list(cart.cart_items.select_related("product").all())

    if not cart_items:
        return Response(
            {"error": "Your cart is empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 3. lock the products and check stock
    product_ids = sorted({item.product_id for item in cart_items})
    products = (
        Product.objects.select_for_update()
        .filter(pk__in=product_ids)
        .order_by("pk")
    )
    products_by_id = {product.pk: product for product in products}

    for item in cart_items:
        product = products_by_id[item.product_id]
        if product.current_stock < item.quantity:
            return Response(
                {"error": f"Insufficient stock for {product.product_name}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # 4. work out the total on the server (never trust the browser's number)
    total = sum(
        (
            products_by_id[item.product_id].product_price * item.quantity
            for item in cart_items
        ),
        Decimal("0.00"),
    )

    # 5. create the order
    order = Order.objects.create(
        user=request.user,
        total=total,
        status="pending",
        payment_method=payment_method,
        payment_status="unpaid",
        **info,  # full_name, phone, address, city, postal_code, notes
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

    # 6. empty the cart only after the order items exist
    cart.cart_items.all().delete()

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------
#  PAYMENT INFORMATION
# ---------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def payment_methods(request):
    """Public: the options shown on the checkout page."""
    ensure_default_payment_methods()
    methods = PaymentMethod.objects.all()
    return Response(PaymentMethodSerializer(methods, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def payment_instructions(request, order_id):
    """Private: how to pay for one of YOUR orders.

    Bank details are only returned to the customer who owns an unpaid EFT order,
    never to the public."""
    order = get_object_or_404(Order, pk=order_id, user=request.user)
    method = PaymentMethod.objects.filter(code=order.payment_method).first()

    data = {
        "method": order.payment_method,
        "label": method.label if method else order.get_payment_method_display(),
        "reference": order.reference,
        "amount": str(order.total),
        "payment_status": order.payment_status,
        "instructions": method.instructions if method else "",
        "bank_account": None,
    }

    if (
        order.payment_method == "eft"
        and order.payment_status != "paid"
        and order.status != "cancelled"
    ):
        account = BankAccount.objects.filter(is_active=True).first()
        if account:
            data["bank_account"] = BankAccountSerializer(account).data

    return Response(data)
