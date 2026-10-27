from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_cart, name="get-cart"),
    path("items/", views.add_cartItem, name="add-cart-item"),
    path(
        "items/<int:item_id>/",
        views.cartItem_quantity,
        name="update-cart-item",
    ),
    path(
        "items/<int:item_id>/remove/",
        views.remove_cartItem,
        name="remove-cart-item",
    ),
    path("checkout/", views.checkout, name="checkout"),
]