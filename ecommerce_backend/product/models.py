from django.db import models

# Create your models here.

class Product(models.Model):
    category = models.ForeignKey(
        "Category",
        on_delete = models.CASCADE,
        db_column = "category_id",
        related_name = "products",
    )
    product_name = models.CharField(max_length=255)
    description = models.TextField()
    product_price = models.DecimalField(max_digits = 10, decimal_places = 2,)

    class Meta:
        db_table = "products"

    def __str__(self):
        return self.product_name