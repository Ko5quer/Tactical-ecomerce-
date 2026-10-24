from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):

    def validate_product_price(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Product price must not be greater than zero"
            )
        return value
    
    class Meta:
        model = Product
        fields = "__all__"


        