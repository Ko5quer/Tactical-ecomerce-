from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from products.models import Product
from products.serializers import ProductSerializer

from .models import Category
from .serializers import CategorySerializer


@api_view(["GET"])
def get_categories(request):
    categories = Category.objects.prefetch_related("products").order_by("id")
    serializer = CategorySerializer(
        categories, many=True, context={"request": request}
    )
    return Response(serializer.data)


@api_view(["GET"])
def get_category(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response(
            {"error": "Category not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = CategorySerializer(category, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def get_category_products(request, category_id):
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response(
            {"error": "Category not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    products = Product.objects.filter(category=category).select_related("category")

    serializer = ProductSerializer(
        products, many=True, context={"request": request}
    )
    return Response(serializer.data)
