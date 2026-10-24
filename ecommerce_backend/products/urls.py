from django.urls import path, include
from .views import get_product, hello
urlpatterns = [
    path("hello/", hello ),
    path('<int:product_id>/', get_product, name = "get_product" ),
    
]