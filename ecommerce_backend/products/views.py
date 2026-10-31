import random
from collections import defaultdict

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from categories.models import Category
from categories.serializers import CategorySerializer

from .models import Product
from .serializers import ProductSerializer


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
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = ProductSerializer(product, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def featured_products(request):
    """Random in-stock products, spread across different categories.

    GET /api/products/featured/?limit=8
    """
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

    # take one product from each category in turn until we have enough
    picked = []
    while len(picked) < limit and any(buckets.values()):
        for category_id in categories:
            if buckets[category_id] and len(picked) < limit:
                picked.append(buckets[category_id].pop())

    products = {p.id: p for p in Product.objects.filter(id__in=picked)}
    ordered = [products[i] for i in picked]

    serializer = ProductSerializer(ordered, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def search_products(request):
    """Search products (name, description, category name) and categories (name).

    GET /api/products/search/?q=cargo&limit=24
    Every word typed must match somewhere, so "black cargo" narrows the results.
    """
    q = " ".join((request.query_params.get("q") or "").split())[:100]

    if len(q) < 2:
        return Response({"query": q, "products": [], "categories": []})

    try:
        limit = max(1, min(int(request.query_params.get("limit", 24)), 48))
    except ValueError:
        limit = 24

    products = Product.objects.select_related("category")
    for term in q.split()[:6]:
        products = products.filter(
            Q(product_name__icontains=term)
            | Q(description__icontains=term)
            | Q(category__name__icontains=term)
        )
    products = products.order_by("product_name")[:limit]

    categories = (
        Category.objects.filter(name__icontains=q)
        .prefetch_related("products")
        .order_by("name")[:8]
    )

    context = {"request": request}
    return Response(
        {
            "query": q,
            "products": ProductSerializer(products, many=True, context=context).data,
            "categories": CategorySerializer(categories, many=True, context=context).data,
        }
    )
