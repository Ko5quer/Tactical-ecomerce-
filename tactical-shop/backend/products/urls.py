from django.urls import path

from .views import featured_products, get_product, hello, search_products

urlpatterns = [
    path("hello/", hello, name="hello"),
    path("featured/", featured_products, name="featured_products"),
    path("search/", search_products, name="search_products"),
    path("<int:product_id>/", get_product, name="get_product"),
]
