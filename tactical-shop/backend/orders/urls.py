from django.urls import path

from . import views

urlpatterns = [
    path("", views.get_orders, name="get_orders"),
    path("checkout/", views.checkout, name="checkout"),
    path("payment-methods/", views.payment_methods, name="payment_methods"),
    path("<int:order_id>/", views.get_order, name="get_order"),
    path(
        "<int:order_id>/payment-instructions/",
        views.payment_instructions,
        name="payment_instructions",
    ),
]
