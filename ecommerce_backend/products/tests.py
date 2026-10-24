from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse

from .models import Product
from categories.models import Category
from .serializers import ProductSerializer

# Create your tests here.
class GetProductTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.category = Category.objects.create(
            name="Test Category"
        )

        self.product = Product.objects.create(
            category=self.category,
            product_name="Test Product",
            description="A product created for testing",
            product_price="99.99",
        )

    def test_get_existing_product(self):
        url = reverse(
            "get_product",
            args=[self.product.id]
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        expected_data = ProductSerializer(
            self.product
        ).data

        self.assertEqual(response.data, expected_data)

    def test_get_nonexistent_product(self):
        url = reverse("get_product", args=[999999])

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.assertEqual(
            response.data,
            {"error": "Product not found"}
        )

    
    def test_post_request_is_not_allowed(self):
        url = reverse(
            "get_product",
            args=[self.product.id]
        )

        response = self.client.post(url, {})

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def test_non_integer_product_id_returns_404(self):
        response = self.client.get(
            "/api/products/invalid/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )



class ProductSerializerTests(TestCase):

    def setUp(self):
        self.category = Category.objects.create(
            name="Clothing"
        )

        self.product = Product.objects.create(
            category=self.category,
            product_name="Tactical Jacket",
            description="A durable tactical jacket",
            product_price="599.99",
        )

    def test_product_serializes_correctly(self):
        serializer = ProductSerializer(
            instance=self.product
        )

        data = serializer.data

        self.assertEqual(
            data["product_name"],
            "Tactical Jacket"
        )
        self.assertEqual(
            data["description"],
            "A durable tactical jacket"
        )
        self.assertEqual(
            data["product_price"],
            "599.99"
        )

    def test_product_without_image_serializes(self):
        serializer = ProductSerializer(
            instance=self.product
        )

        self.assertIsNone(
            self.product.image.name or None
        )


class ProductSerializerValidationTests(TestCase):

    def setUp(self):
        self.category = Category.objects.create(
            name="Test Category"
        )

        self.valid_data = {
            "category": self.category.id,
            "product_name": "Test Jacket",
            "description": "A test product",
            "product_price": "199.99",
            "image": None,
        }

    def test_valid_product_data_is_accepted(self):
        serializer = ProductSerializer(
            data=self.valid_data
        )

        self.assertTrue(
            serializer.is_valid(),
            serializer.errors
        )

    def test_missing_product_name_is_rejected(self):
        data = self.valid_data.copy()
        data.pop("product_name")

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "product_name",
            serializer.errors
        )

    def test_invalid_category_is_rejected(self):
        data = self.valid_data.copy()
        data["category"] = 999999

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "category",
            serializer.errors
        )
    
    def test_zero_price_is_rejected(self):
        data = self.valid_data.copy()
        data["product_price"] = "0.00"

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "product_price",
            serializer.errors
        )

    def test_negative_price_is_rejected(self):
        data = self.valid_data.copy()
        data["product_price"] = "-10.00"

        serializer = ProductSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "product_price",
            serializer.errors
        )

