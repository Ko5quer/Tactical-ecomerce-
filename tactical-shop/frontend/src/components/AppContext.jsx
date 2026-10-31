import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearTokens, getTokens, setTokens } from "./api";

/* ======================= AUTH ======================= */
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getTokens()));
  const [authOpen, setAuthOpen] = useState(false); // login popup visibility

  // On page load: if we have a saved token, find out who it belongs to.
  useEffect(() => {
    if (!getTokens()) return;
    api("/api/accounts/me/")
      .then(setUser)
      .catch((err) => {
        if (err.status === 401) clearTokens(); // only drop tokens if they're truly invalid
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const tokens = await api("/api/accounts/login/", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setTokens(tokens);
    setUser(await api("/api/accounts/me/"));
  };

  const register = async ({ email, password, first_name, last_name }) => {
    await api("/api/accounts/register/", {
      method: "POST",
      body: { email, password, first_name, last_name },
      auth: false,
    });
    await login(email, password);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    authOpen,
    openAuth: () => setAuthOpen(true),
    closeAuth: () => setAuthOpen(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ======================= CART ======================= */
const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null); // null = not loaded yet / logged out

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      setCart(await api("/api/carts/"));
    } catch (err) {
      console.warn("[cart] could not load cart:", err);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const items = cart?.cart_items ?? [];
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.product_price) * i.quantity, 0);

  const addToCart = async (productId, quantity = 1) => {
    await api("/api/carts/items/", { method: "POST", body: { product_id: productId, quantity } });
    await refresh();
  };

  const updateQuantity = async (itemId, quantity) => {
    await api(`/api/carts/items/${itemId}/`, { method: "PATCH", body: { quantity } });
    await refresh();
  };

  const removeItem = async (itemId) => {
    await api(`/api/carts/items/${itemId}/remove/`, { method: "DELETE" });
    await refresh();
  };

  // Sends delivery details + payment method; the server creates the order,
  // takes the stock and empties the cart. Returns the new order.
  const checkout = async (details) => {
    const order = await api("/api/orders/checkout/", { method: "POST", body: details });
    refresh(); // not awaited, so the page can move on before the cart visibly empties
    return order;
  };

  return (
    <CartContext.Provider
      value={{ cart, items, count, subtotal, addToCart, updateQuantity, removeItem, checkout, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}
