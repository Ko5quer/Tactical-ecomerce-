from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import Category
from .serializers import CategorySerializer
# Create your tests here.



class CategoryViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.category = Category.objects.create(
            name="Tactical Clothing"
        )

        self.second_category = Category.objects.create(
            name="Accessories"
        )

    def test_get_all_categories(self):
        url = reverse("get_categories")

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_single_category(self):
        url = reverse("get_category", args=[self.category.id])

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.category.id)
        self.assertEqual(response.data["name"], "Tactical Clothing")

    def test_get_nonexistent_category(self):
        url = reverse("get_category", args=[999999])

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )
        self.assertEqual(
            response.data,
            {"error": "Category not found"}
        )

    def test_post_to_category_list_is_not_allowed(self):
        url = reverse("get_categories")

        response = self.client.post(url, {"name": "New Category"})

        self.assertEqual(
            response.status_code,
            status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def test_non_integer_category_id_returns_404(self):
        response = self.client.get("/api/categories/invalid/")

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )


class CategorySerializerTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Tactical Gear"
        )

    def test_category_serializes_correctly(self):
        serializer = CategorySerializer(self.category)

        self.assertEqual(serializer.data["id"], self.category.id)
        self.assertEqual(serializer.data["name"], "Tactical Gear")

    def test_category_list_serializes_correctly(self):
        Category.objects.create(name="Footwear")

        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)

        self.assertEqual(len(serializer.data), 2)
        self.assertEqual(
            serializer.data[0]["name"],
            "Tactical Gear"
        )