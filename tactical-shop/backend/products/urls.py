from django.urls import path

from .views import featured_products, get_product, hello

urlpatterns = [
    path("hello/", hello, name="hello"),
    path("featured/", featured_products, name="featured_products"),
    path("<int:product_id>/", get_product, name="get_product"),
]
