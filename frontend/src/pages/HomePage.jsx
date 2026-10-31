import Categories from "../components/Categories";
import FeaturedProducts from "../components/FeaturedProducts";
import { API_URL } from "../components/api";

export default function HomePage() {
  return (
    <>
      <Categories endpoint={`${API_URL}/api/categories/`} mediaBase={API_URL} />
      <FeaturedProducts />
    </>
  );
}
