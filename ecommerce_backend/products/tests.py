
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from categories.models import Category
from .models import Product
from .serializers import ProductSerializer


class ProductHealthCheckTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_hello_returns_200(self):
        response = self.client.get(reverse("hello"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_hello_returns_expected_message(self):
        response = self.client.get(reverse("hello"))

        self.assertEqual(
            response.data,
            {"message": "Hello World"},
        )

    def test_hello_rejects_post(self):
        response = self.client.post(reverse("hello"))

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class GetProductTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.category = Category.objects.create(
            name="Test Category",
        )

        self.product = Product.objects.create(
            category=self.category,
            product_name="Test Product",
            description="A product created for testing",
            product_price=Decimal("99.99"),
            current_stock=10,
        )

    def test_get_existing_product(self):
        url = reverse("get_product", args=[self.product.id])

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        expected_data = ProductSerializer(self.product).data
        self.assertEqual(response.data, expected_data)

    def test_get_nonexistent_product(self):
        url = reverse("get_product", args=[999999])

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            response.data,
            {"error": "Product not found"},
        )

    def test_get_product_returns_correct_name(self):
        url = reverse("get_product", args=[self.product.id])

        response = self.client.get(url)

        self.assertEqual(
            response.data["product_name"],
            "Test Product",
        )

    def test_get_product_returns_correct_price(self):
        url = reverse("get_product", args=[self.product.id])

        response = self.client.get(url)

        self.assertEqual(
            Decimal(str(response.data["product_price"])),
            Decimal("99.99"),
        )

    def test_get_product_returns_correct_stock(self):
        url = reverse("get_product", args=[self.product.id])

        response = self.client.get(url)

        self.assertEqual(response.data["current_stock"], 10)

    def test_get_product_does_not_change_stock(self):
        url = reverse("get_product", args=[self.product.id])

        self.client.get(url)

        self.product.refresh_from_db()
        self.assertEqual(self.product.current_stock, 10)

    def test_get_product_rejects_post(self):
        url = reverse("get_product", args=[self.product.id])

        response = self.client.post(
            url,
            {"product_name": "Changed Product"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

        self.product.refresh_from_db()
        self.assertEqual(
            self.product.product_name,
            "Test Product",
        )
