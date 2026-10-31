import Categories from "../components/Categories";
import { API_URL } from "../components/api";

export default function CategoriesPage() {
  return <Categories endpoint={`${API_URL}/api/categories/`} mediaBase={API_URL} />;
}
