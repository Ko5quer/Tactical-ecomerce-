from django.contrib import admin, messages
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from products.models import Product

from .models import BankAccount, Order, OrderItem, PaymentGateway, PaymentMethod


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("created_at", "updated_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id", "full_name", "phone", "total",
        "payment_method", "payment_status", "status", "created_at",
    )
    list_display_links = ("id", "full_name")
    list_editable = ("status", "payment_status")   # change these right in the list
    list_filter = ("status", "payment_status", "payment_method", "created_at")
    search_fields = ("user__email", "full_name", "phone", "address")
    inlines = [OrderItemInline]
    actions = ["mark_processing", "mark_completed", "mark_paid", "cancel_and_restock"]

    @admin.action(description="Mark selected orders as Processing")
    def mark_processing(self, request, queryset):
        n = queryset.exclude(status="cancelled").update(
            status="processing", updated_at=timezone.now()
        )
        self.message_user(request, f"{n} order(s) marked as processing.")

    @admin.action(description="Mark selected orders as Completed")
    def mark_completed(self, request, queryset):
        n = queryset.exclude(status="cancelled").update(
            status="completed", updated_at=timezone.now()
        )
        self.message_user(request, f"{n} order(s) marked as completed.")

    @admin.action(description="Mark selected orders as Paid")
    def mark_paid(self, request, queryset):
        n = queryset.update(payment_status="paid", updated_at=timezone.now())
        self.message_user(request, f"{n} order(s) marked as paid.")

    @admin.action(description="Cancel selected orders and return items to stock")
    @transaction.atomic
    def cancel_and_restock(self, request, queryset):
        count = 0
        orders = queryset.exclude(status="cancelled").prefetch_related("order_items")
        for order in orders:
            for item in order.order_items.all():
                Product.objects.filter(pk=item.product_id).update(
                    current_stock=F("current_stock") + item.quantity
                )
            order.status = "cancelled"
            order.save(update_fields=["status", "updated_at"])
            count += 1
        self.message_user(
            request, f"{count} order(s) cancelled and stock restored.", messages.SUCCESS
        )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "product", "quantity", "price")
    list_filter = ("created_at",)
    search_fields = ("product__product_name", "order__id")


# ---------------------------------------------------------------------
#  PAYMENT SETTINGS
# ---------------------------------------------------------------------

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ("label", "code", "is_enabled", "sort_order")
    list_editable = ("is_enabled", "sort_order")


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ("bank_name", "account_holder", "account_number", "is_active", "updated_at")
    list_editable = ("is_active",)


@admin.register(PaymentGateway)
class PaymentGatewayAdmin(admin.ModelAdmin):
    list_display = ("provider", "is_sandbox", "is_active", "updated_at")
