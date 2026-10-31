from django.conf import settings
from django.db import models

PAYMENT_METHOD_CHOICES = [
    ("cod", "Cash on delivery"),
    ("eft", "Bank transfer (EFT)"),
    ("card", "Card / online"),
]


class Order(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("unpaid", "Unpaid"),
        ("paid", "Paid"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )

    total = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, default="cod"
    )
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default="unpaid"
    )

    # delivery details
    full_name = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    address = models.CharField(max_length=255, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    postal_code = models.CharField(max_length=20, blank=True, default="")
    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def reference(self):
        """Shown to the customer and used as the EFT payment reference."""
        return f"ORD-{self.pk:05d}"

    def __str__(self):
        return f"Order #{self.pk} - {self.status}"


class OrderItem(models.Model):

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="order_items"
    )
    product = models.ForeignKey(
        "products.Product", on_delete=models.PROTECT, related_name="order_items"
    )
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gte=1),
                name="order_item_quantity_at_least_one",
            ),
        ]

    def __str__(self):
        return f"{self.product.product_name} x {self.quantity}"


# =====================================================================
#  PAYMENT SETTINGS (edited by the shop owner in /admin/)
# =====================================================================

class PaymentMethod(models.Model):
    """Which payment options customers see at checkout, and what we tell
    them after they order. Turn a method on/off with is_enabled."""

    code = models.CharField(max_length=20, unique=True, choices=PAYMENT_METHOD_CHOICES)
    label = models.CharField(max_length=100)
    description = models.CharField(
        max_length=255, blank=True, default="", help_text="Short text shown at checkout."
    )
    instructions = models.TextField(
        blank=True,
        default="",
        help_text="Shown to the customer on their order page after ordering.",
    )
    is_enabled = models.BooleanField(
        default=True, help_text="Untick to show it as 'Coming soon' and refuse orders."
    )
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.label


class BankAccount(models.Model):
    """Bank details shown to customers who choose EFT. Only ONE account is
    active at a time: activating one switches the others off."""

    ACCOUNT_TYPES = [
        ("business", "Business account"),
        ("cheque", "Cheque / current"),
        ("savings", "Savings"),
        ("transmission", "Transmission"),
    ]

    bank_name = models.CharField(max_length=100)
    account_holder = models.CharField(max_length=150)
    account_number = models.CharField(max_length=30)
    branch_code = models.CharField(max_length=20)
    branch_name = models.CharField(max_length=100, blank=True, default="")
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default="business")
    swift_code = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Only needed if you accept international payments.",
    )
    proof_of_payment_email = models.EmailField(
        blank=True,
        default="",
        help_text="Where customers should send proof of payment.",
    )
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_active", "-updated_at"]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_active:
            BankAccount.objects.exclude(pk=self.pk).filter(is_active=True).update(is_active=False)

    def __str__(self):
        return f"{self.bank_name} - {self.account_holder}"


class PaymentGateway(models.Model):
    """NON-SECRET settings for an online card gateway.

    SECRET values (merchant key, secret key, passphrase) must NOT be stored
    here. Put them in environment variables and read them in settings.py.
    """

    PROVIDERS = [
        ("payfast", "PayFast"),
        ("yoco", "Yoco"),
        ("ozow", "Ozow"),
        ("stripe", "Stripe"),
        ("paypal", "PayPal"),
        ("other", "Other"),
    ]

    provider = models.CharField(max_length=20, choices=PROVIDERS)
    is_sandbox = models.BooleanField(
        default=True, help_text="Test mode. Untick only when you go live."
    )
    is_active = models.BooleanField(default=False)
    merchant_id = models.CharField(
        max_length=100, blank=True, default="", help_text="Public merchant identifier."
    )
    public_key = models.CharField(
        max_length=255, blank=True, default="", help_text="Publishable key, if the provider has one."
    )
    notes = models.TextField(
        blank=True, default="", help_text="Reminders for yourself. Never paste secret keys here."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        mode = "sandbox" if self.is_sandbox else "live"
        return f"{self.get_provider_display()} ({mode})"


DEFAULT_PAYMENT_METHODS = [
    # code, label, checkout description, after-order instructions, enabled, order
    ("cod", "Cash on delivery", "Pay in cash when your order arrives.",
     "Please have the exact amount ready when your order arrives.", True, 1),
    ("eft", "Bank transfer (EFT)",
     "Pay by EFT. We'll show our bank details after you order and process it once payment reflects.",
     "Use your order reference as the payment reference. We process your order once the payment reflects.",
     True, 2),
    ("card", "Card / online payment", "Pay securely online with your card.", "", False, 3),
]


def ensure_default_payment_methods():
    """Creates the three standard methods the first time they are needed."""
    if PaymentMethod.objects.exists():
        return
    for code, label, description, instructions, enabled, order in DEFAULT_PAYMENT_METHODS:
        PaymentMethod.objects.get_or_create(
            code=code,
            defaults={
                "label": label,
                "description": description,
                "instructions": instructions,
                "is_enabled": enabled,
                "sort_order": order,
            },
        )
