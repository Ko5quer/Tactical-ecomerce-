from django.urls import path
from .views import hello, get_product

urlpatterns = [
    path("hello/", hello, name="hello"),
    path("<int:product_id>/", get_product, name="get_product"),
]