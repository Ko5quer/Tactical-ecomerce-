import logging

from django.conf import settings
from django.core.mail import send_mail

from .models import BankAccount, PaymentMethod

log = logging.getLogger(__name__)


def send_order_email(order, paid=False):
    """Emails the customer about their order. Never raises: a mail problem
    must not break checkout or the PayFast notification."""
    try:
        to = order.user.email
        if not to:
            return

        items = order.order_items.select_related("product")
        lines = [
            f"- {i.product.product_name} x {i.quantity}: R{i.price * i.quantity:.2f}"
            for i in items
        ]

        if paid:
            subject = f"Payment received - order {order.reference}"
            intro = "We've received your payment. Thank you!"
        else:
            subject = f"We've received your order {order.reference}"
            intro = "Thanks for your order. Here are the details."

        body = [
            f"Hi {order.full_name or 'there'},",
            "",
            intro,
            "",
            f"Order reference: {order.reference}",
            *lines,
            f"Total: R{order.total:.2f}",
            "",
            f"Delivery to: {order.address}, {order.city} {order.postal_code}".strip(),
            f"Payment method: {order.get_payment_method_display()}",
        ]

        if not paid:
            method = PaymentMethod.objects.filter(code=order.payment_method).first()
            if method and method.instructions:
                body += ["", method.instructions]

            if order.payment_method == "eft":
                acc = BankAccount.objects.filter(is_active=True).first()
                if acc:
                    body += [
                        "",
                        "Bank details:",
                        f"Bank: {acc.bank_name}",
                        f"Account holder: {acc.account_holder}",
                        f"Account number: {acc.account_number}",
                        f"Branch code: {acc.branch_code}",
                        f"Reference: {order.reference}",
                    ]
                    if acc.proof_of_payment_email:
                        body.append(f"Send proof of payment to: {acc.proof_of_payment_email}")

        body += ["", f"View your order: {settings.FRONTEND_URL}/orders/{order.pk}"]

        send_mail(subject, "\n".join(body), settings.DEFAULT_FROM_EMAIL, [to])
    except Exception:
        log.exception("Could not send email for order %s", order.pk)
