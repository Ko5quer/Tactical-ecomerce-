from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from . import payfast
from .models import Order


def _client_ip(request):
    if getattr(settings, "PAYFAST_TRUST_X_FORWARDED_FOR", False):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def payfast_start(request, order_id):
    """Returns the PayFast URL + signed fields. The frontend POSTs them as a form."""
    order = get_object_or_404(Order, pk=order_id, user=request.user)

    if order.payment_method != "card":
        return Response({"error": "This order is not a card order."}, status=400)
    if order.payment_status == "paid" or order.status == "cancelled":
        return Response({"error": "This order can no longer be paid."}, status=400)

    return Response(
        {
            "url": payfast.process_url(),
            "fields": payfast.build_checkout_fields(order, request.user),
        }
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def payfast_notify(request):
    """PayFast ITN. This, not the return URL, is what marks an order paid."""
    pairs = [(k, v) for k, v in request.POST.items() if k != "signature"]
    data = request.POST
    bad = Response(status=status.HTTP_400_BAD_REQUEST)

    # 1. Signature, 2. source IP, 3. merchant
    if not payfast.signature_ok(pairs, data.get("signature")):
        return bad
    if not payfast.ip_ok(_client_ip(request)):
        return bad
    if data.get("merchant_id") != settings.PAYFAST_MERCHANT_ID:
        return bad

    # 4. Order exists and amount matches
    try:
        order = Order.objects.get(pk=int(data.get("m_payment_id", "")))
        paid = Decimal(data.get("amount_gross", ""))
    except (Order.DoesNotExist, ValueError, InvalidOperation):
        return bad
    if abs(paid - order.total) > Decimal("0.01"):
        return bad

    # 5. Confirm with PayFast (network call, kept outside the DB lock)
    if not payfast.confirmed_by_payfast(pairs):
        return bad

    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order.pk)
        if data.get("payment_status") == "COMPLETE" and order.payment_status != "paid":
            order.payment_status = "paid"
            order.payment_method = "card"
            if order.status == "pending":
                order.status = "processing"
            order.payfast_payment_id = data.get("pf_payment_id", "")
            order.save(
                update_fields=[
                    "payment_status",
                    "payment_method",
                    "status",
                    "payfast_payment_id",
                    "updated_at",
                ]
            )

    return Response(status=status.HTTP_200_OK)
