from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status

from .models import Product
from .serializers import ProductSerializer
# Create your views here.

@api_view(["GET"])
def hello(request):
    return Response({"message": "Hello World"})

@api_view(["GET"])
def get_product(request, product_id):
    try: 
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"},
            status = status.HTTP_404_NOT_FOUND
        )
    serializer = ProductSerializer(product)
    return Response(serializer.data)