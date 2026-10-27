
from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_orders, name="get_orders"),
    path("checkout/", views.checkout, name="checkout"),
    path("<int:order_id>/", views.get_order, name="get_order"),
]
