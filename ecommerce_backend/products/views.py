from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status

from .models import Product
from .serializers import ProductSerializer

import random
from collections import defaultdict
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




@api_view(["GET"])
def featured_products(request):
    try:
        limit = max(1, min(int(request.query_params.get("limit", 8)), 24))
    except ValueError:
        limit = 8

    # (product id, category id) for everything in stock, shuffled
    rows = list(
        Product.objects.filter(current_stock__gt=0).values_list("id", "category_id")
    )
    random.shuffle(rows)

    buckets = defaultdict(list)
    for product_id, category_id in rows:
        buckets[category_id].append(product_id)

    categories = list(buckets)
    random.shuffle(categories)

    # take one from each category in turn until we have enough
    picked = []
    while len(picked) < limit and any(buckets.values()):
        for category_id in categories:
            if buckets[category_id] and len(picked) < limit:
                picked.append(buckets[category_id].pop())

    products = {p.id: p for p in Product.objects.filter(id__in=picked)}
    ordered = [products[i] for i in picked]

    serializer = ProductSerializer(ordered, many=True, context={"request": request})
    return Response(serializer.data)
