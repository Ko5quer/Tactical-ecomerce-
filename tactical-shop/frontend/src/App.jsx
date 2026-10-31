import { Link, Route, Routes } from "react-router-dom";
import { AuthProvider, CartProvider } from "./components/AppContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import OrderPage from "./pages/OrderPage";
import OrdersPage from "./pages/OrdersPage";
import CheckoutPage from "./pages/CheckoutPage";
import AboutPage from "./pages/AboutPage";
import EventsPage from "./pages/EventsPage";

function NotFound() {
  return (
    <main className="page">
      <div className="notice">
        <p>Page not found.</p>
        <Link to="/" className="btn">Back home</Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:id" element={<CategoryPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
