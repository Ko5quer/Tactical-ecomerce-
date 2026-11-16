"""PayFast helpers: build the checkout form, sign it, and validate ITNs.

Secrets (merchant key, passphrase) come from settings / environment variables,
never from the database.
"""
import hashlib
import hmac
import ipaddress
import urllib.parse
import urllib.request

from django.conf import settings

LIVE_HOST = "https://www.payfast.co.za"
SANDBOX_HOST = "https://sandbox.payfast.co.za"

# PayFast's published ITN source addresses. Re-check against their docs
# before going live, as they can change.
PAYFAST_NETWORKS = [
    "197.97.145.144/28",
    "41.74.179.192/27",
    "102.216.36.0/28",
    "102.216.36.128/28",
    "144.126.193.139/32",
]


def _host():
    return SANDBOX_HOST if settings.PAYFAST_SANDBOX else LIVE_HOST


def process_url():
    return f"{_host()}/eng/process"


def validate_url():
    return f"{_host()}/eng/query/validate"


def _encode(value):
    # Matches PHP urlencode(): uppercase hex, spaces as "+", "~" encoded.
    return urllib.parse.quote_plus(str(value).strip(), safe="").replace("~", "%7E")


def param_string(pairs, skip_blank=True):
    return "&".join(
        f"{key}={_encode(value)}"
        for key, value in pairs
        if not (skip_blank and value in ("", None))
    )


def make_signature(pairs, passphrase="", skip_blank=True):
    text = param_string(pairs, skip_blank)
    if passphrase:
        text += f"&passphrase={_encode(passphrase)}"
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def build_checkout_fields(order, user):
    """Fields for the form the browser POSTs to PayFast.

    ORDER MATTERS: PayFast signs fields in this documented order.
    """
    first, _, last = (order.full_name or "").strip().partition(" ")
    pairs = [
        ("merchant_id", settings.PAYFAST_MERCHANT_ID),
        ("merchant_key", settings.PAYFAST_MERCHANT_KEY),
        ("return_url", f"{settings.FRONTEND_URL}/orders/{order.pk}?payment=success"),
        ("cancel_url", f"{settings.FRONTEND_URL}/orders/{order.pk}?payment=cancelled"),
        ("notify_url", f"{settings.BACKEND_URL}/api/orders/payfast/notify/"),
        ("name_first", first or "Customer"),
        ("name_last", last),
        ("email_address", getattr(user, "email", "") or ""),
        ("m_payment_id", str(order.pk)),
        ("amount", f"{order.total:.2f}"),
        ("item_name", f"Order {order.reference}"),
    ]
    pairs = [(k, v) for k, v in pairs if v not in ("", None)]
    pairs.append(("signature", make_signature(pairs, settings.PAYFAST_PASSPHRASE)))
    return dict(pairs)


def signature_ok(pairs, received):
    """pairs = every ITN field except 'signature', in the order received."""
    expected = make_signature(pairs, settings.PAYFAST_PASSPHRASE, skip_blank=False)
    return hmac.compare_digest(expected, (received or "").lower())


def ip_ok(ip):
    if not getattr(settings, "PAYFAST_CHECK_IP", True):
        return True
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(addr in ipaddress.ip_network(net) for net in PAYFAST_NETWORKS)


def confirmed_by_payfast(pairs):
    """Server-to-server check: POST the data back, PayFast answers VALID."""
    body = param_string(pairs, skip_blank=False).encode("utf-8")
    req = urllib.request.Request(validate_url(), data=body, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode().strip() == "VALID"
    except Exception:
        return False
