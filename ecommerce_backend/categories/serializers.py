from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "image"]

    def get_image(self, obj):
        product = next((p for p in obj.products.all() if p.image), None)
        if not product:
            return None
        request = self.context.get("request")
        url = product.image.url
        return request.build_absolute_uri(url) if request else url


