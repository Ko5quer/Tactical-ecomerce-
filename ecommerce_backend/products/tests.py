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
            category_name="Test Category"
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
