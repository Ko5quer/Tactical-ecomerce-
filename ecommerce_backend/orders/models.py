
from django.db import models
from django.conf import settings


class Order(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )

    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.pk} - {self.status}"


class OrderItem(models.Model):

    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="order_items",
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
    )

    quantity = models.PositiveIntegerField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

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
