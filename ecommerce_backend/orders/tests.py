
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from categories.models import Category
from products.models import Product
from carts.models import Cart, CartItem
from orders.models import Order, OrderItem


User = get_user_model()


class CheckoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create_user(
            username="testcustomer",
            email="customer@example.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Customer",
        )
        self.other_user = User.objects.create_user(
            username="othercustomer",
            email="other@example.com",
            password="TestPass123!",
            first_name="Other",
            last_name="Customer",
        )

        self.category = Category.objects.create(
            name="Test Category"
        )

        self.product1 = Product.objects.create(
            category=self.category,
            product_name="Test Product 1",
            description="First test product",
            product_price=Decimal("100.00"),
            current_stock=10,
        )

        self.product2 = Product.objects.create(
            category=self.category,
            product_name="Test Product 2",
            description="Second test product",
            product_price=Decimal("50.00"),
            current_stock=5,
        )

        self.cart = Cart.objects.create(user=self.user)

        self.client.force_authenticate(user=self.user)

    def add_to_cart(self, product, quantity):
        return CartItem.objects.create(
            cart=self.cart,
            product=product,
            quantity=quantity,
        )

    def checkout(self):
        return self.client.post(
            "/api/orders/checkout/",
            {},
            format="json",
        )

    def test_checkout_creates_order(self):
        """A valid cart should produce one order."""
        self.add_to_cart(self.product1, 2)

        response = self.checkout()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)

        order = Order.objects.get()
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.status, "pending")

    def test_checkout_with_multiple_items(self):
        """Multiple cart products should become items in one order."""
        self.add_to_cart(self.product1, 2)
        self.add_to_cart(self.product2, 3)

        response = self.checkout()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order = Order.objects.get()
        self.assertEqual(order.order_items.count(), 2)

    def test_checkout_calculates_correct_total(self):
        """The total must equal the sum of item prices times quantities."""
        self.add_to_cart(self.product1, 2)
        self.add_to_cart(self.product2, 3)

        response = self.checkout()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order = Order.objects.get()
        self.assertEqual(order.total, Decimal("350.00"))

    def test_order_item_saves_purchase_price(self):
        """Order items must retain the price charged at checkout."""
        self.add_to_cart(self.product1, 2)

        response = self.checkout()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order_item = OrderItem.objects.get()
        self.assertEqual(order_item.price, Decimal("100.00"))

    def test_checkout_reduces_stock(self):
        """Purchased quantities must be deducted from stock."""
        self.add_to_cart(self.product1, 3)

        response = self.checkout()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.product1.refresh_from_db()
        self.assertEqual(self.product1.current_stock, 7)

    def test_checkout_clears_cart(self):
        """Successful checkout must remove the purchased cart items."""
        self.add_to_cart(self.product1, 2)

        response = self.checkout()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.cart.cart_items.count(), 0)

    def test_empty_cart_is_rejected(self):
        """An empty cart must not create an order."""
        response = self.checkout()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Order.objects.count(), 0)

    def test_insufficient_stock_is_rejected(self):
        """A customer cannot purchase more stock than is available."""
        self.add_to_cart(self.product1, 11)

        response = self.checkout()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Order.objects.count(), 0)

        self.product1.refresh_from_db()
        self.assertEqual(self.product1.current_stock, 10)

    def test_failed_checkout_does_not_partially_process_cart(self):
        """One unavailable product must prevent the whole checkout."""
        self.add_to_cart(self.product1, 2)
        self.add_to_cart(self.product2, 6)  # Only 5 in stock.

        response = self.checkout()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)

        self.product1.refresh_from_db()
        self.product2.refresh_from_db()

        self.assertEqual(self.product1.current_stock, 10)
        self.assertEqual(self.product2.current_stock, 5)

    def test_checkout_requires_authentication(self):
        """Unauthenticated visitors must not be able to check out."""
        self.client.force_authenticate(user=None)
        self.add_to_cart(self.product1, 1)

        response = self.checkout()

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )
        self.assertEqual(Order.objects.count(), 0)

    def test_customer_can_view_own_orders(self):
        """A customer should be able to retrieve their order history."""
        self.add_to_cart(self.product1, 1)
        self.checkout()

        response = self.client.get("/api/orders/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_customer_cannot_view_another_customers_order(self):
        """Order details must be restricted to the order's owner."""
        other_order = Order.objects.create(
            user=self.other_user,
            total=Decimal("100.00"),
            status="pending",
        )

        response = self.client.get(
            f"/api/orders/{other_order.pk}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_unknown_order_returns_404(self):
        """Requests for nonexistent orders should return 404."""
        response = self.client.get("/api/orders/999999/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_second_checkout_does_not_duplicate_order(self):
        """Checking out again after the cart is cleared should fail."""
        self.add_to_cart(self.product1, 1)

        first_response = self.checkout()
        second_response = self.checkout()

        self.assertEqual(
            first_response.status_code,
            status.HTTP_201_CREATED,
        )
        self.assertEqual(
            second_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(Order.objects.count(), 1)

    def test_cod_payment_defaults(self):
        """New orders should use COD and remain unpaid."""
        self.add_to_cart(self.product1, 1)

        response = self.checkout()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order = Order.objects.get()
        self.assertEqual(order.payment_method, "cod")
        self.assertEqual(order.payment_status, "unpaid")
