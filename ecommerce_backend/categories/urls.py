from django.urls import path
from .views import get_categories, get_category

urlpatterns = [
    path("", get_categories, name="get_categories"),
    path("<int:category_id>/", get_category, name="get_category"),
]