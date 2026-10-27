
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from decimal import Decimal

from products.models import Product

from .models import Category


class CategoryListTests(TestCase):
    """Tests for GET /api/categories/."""

    def setUp(self):
        self.client = APIClient()
        self.url = "/api/categories/"

    def test_list_categories_returns_200(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_categories_returns_empty_list_when_no_categories_exist(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_list_categories_returns_all_categories(self):
        Category.objects.create(name="Clothing")
        Category.objects.create(name="Footwear")
        Category.objects.create(name="Accessories")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        returned_names = {item["name"] for item in response.data}
        self.assertSetEqual(
            returned_names,
            {"Clothing", "Footwear", "Accessories"},
        )

    def test_list_categories_returns_correct_category_data(self):
        category = Category.objects.create(name="Clothing")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], category.id)
        self.assertEqual(response.data[0]["name"], "Clothing")

    def test_list_categories_does_not_modify_database(self):
        Category.objects.create(name="Clothing")
        initial_count = Category.objects.count()

        self.client.get(self.url)

        self.assertEqual(Category.objects.count(), initial_count)

    def test_list_categories_supports_get_only(self):
        response = self.client.post(self.url, {"name": "New category"})

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )
        self.assertFalse(Category.objects.filter(name="New category").exists())


class CategoryDetailTests(TestCase):
    """Tests for GET /api/categories/<category_id>/."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Clothing")
        self.url = f"/api/categories/{self.category.id}/"

    def test_get_category_returns_200(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_category_returns_correct_category(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.category.id)
        self.assertEqual(response.data["name"], "Clothing")

    def test_get_category_returns_expected_fields(self):
        response = self.client.get(self.url)

        self.assertEqual(
            set(response.data.keys()),
            {"id", "name", "created_at", "updated_at"},
        )

    def test_get_category_does_not_return_other_categories(self):
        other_category = Category.objects.create(name="Footwear")

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.category.id)
        self.assertNotEqual(response.data["id"], other_category.id)

    def test_get_nonexistent_category_returns_404(self):
        response = self.client.get("/api/categories/99999/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(response.data["error"], "Category not found")

    def test_get_category_does_not_modify_database(self):
        initial_count = Category.objects.count()

        self.client.get(self.url)

        self.assertEqual(Category.objects.count(), initial_count)

    def test_get_category_supports_get_only(self):
        response = self.client.post(self.url, {"name": "New category"})

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def test_invalid_category_id_returns_404(self):
        # Assumes category_id is an integer URL parameter.
        response = self.client.get("/api/categories/not-a-number/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )


class CategoryModelTests(TestCase):
    """Tests for Category model behaviour."""

    def test_create_category(self):
        category = Category.objects.create(name="Clothing")

        self.assertIsNotNone(category.id)
        self.assertEqual(category.name, "Clothing")
        self.assertEqual(Category.objects.count(), 1)

    def test_category_string_representation(self):
        category = Category.objects.create(name="Clothing")

        self.assertEqual(str(category), "Clothing")

    def test_category_timestamps_are_populated(self):
        category = Category.objects.create(name="Clothing")

        self.assertIsNotNone(category.created_at)
        self.assertIsNotNone(category.updated_at)

    def test_category_uses_expected_database_table(self):
        self.assertEqual(Category._meta.db_table, "categories")



class CategoryProductsTests(TestCase):
    """Tests for GET /api/categories/<category_id>/products/."""

    def setUp(self):
        self.client = APIClient()

        self.clothing = Category.objects.create(name="Clothing")
        self.footwear = Category.objects.create(name="Footwear")

        self.jacket = Product.objects.create(
            category=self.clothing,
            product_name="Tactical Jacket",
            description="Outdoor jacket.",
            product_price=Decimal("599.99"),
            current_stock=10,
        )

        self.boots = Product.objects.create(
            category=self.footwear,
            product_name="Combat Boots",
            description="Durable boots.",
            product_price=Decimal("899.99"),
            current_stock=5,
        )

    def test_returns_products_for_selected_category(self):
        response = self.client.get(
            f"/api/categories/{self.clothing.id}/products/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["product_name"],
            "Tactical Jacket",
        )

    def test_does_not_return_products_from_other_categories(self):
        response = self.client.get(
            f"/api/categories/{self.clothing.id}/products/"
        )

        product_names = {
            item["product_name"] for item in response.data
        }

        self.assertIn("Tactical Jacket", product_names)
        self.assertNotIn("Combat Boots", product_names)

    def test_category_with_no_products_returns_empty_list(self):
        empty_category = Category.objects.create(name="Accessories")

        response = self.client.get(
            f"/api/categories/{empty_category.id}/products/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_nonexistent_category_returns_404(self):
        response = self.client.get(
            "/api/categories/99999/products/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(response.data["error"], "Category not found")
