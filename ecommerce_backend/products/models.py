from django.db import models


class Product(models.Model):
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.CASCADE,
        related_name="products",
    )
    product_name = models.CharField(max_length=255)
    description = models.TextField()
    product_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )
    current_stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(
        upload_to="products/",
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "products"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(current_stock__gte=0),
                name="product_stock_nonnegative",
            ),
        ]

    def __str__(self):
        return self.product_name