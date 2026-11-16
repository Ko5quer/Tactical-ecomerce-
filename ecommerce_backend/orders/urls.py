from django.urls import path

from . import views
from .payfast_views import payfast_notify, payfast_start

urlpatterns = [
    path("", views.get_orders, name="get_orders"),
    path("checkout/", views.checkout, name="checkout"),
    path("payment-methods/", views.payment_methods, name="payment_methods"),
    path("payfast/notify/", payfast_notify, name="payfast_notify"),
    path("<int:order_id>/", views.get_order, name="get_order"),
    path("<int:order_id>/payment-instructions/", views.payment_instructions, name="payment_instructions"),
    path("<int:order_id>/payfast/start/", payfast_start, name="payfast_start"),
]
