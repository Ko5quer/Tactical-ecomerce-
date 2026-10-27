
from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_categories, name="get_categories"),
    path("<int:category_id>/", views.get_category, name="get_category"),
    path("<int:category_id>/products/", views.get_category_products, name="get_category_products",),
]
