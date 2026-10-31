from django.urls import path
from .views import hello, get_product, featured_products

urlpatterns = [
    path("hello/", hello, name="hello"),
    path("<int:product_id>/", get_product, name="get_product"),
    path("featured/", featured_products, name="featured_products"),
]
