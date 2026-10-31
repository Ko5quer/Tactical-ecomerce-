import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../components/AppContext";
import RequireLogin from "../components/RequireLogin";
import { errorMessage, formatPrice, mediaUrl } from "../components/api";

function CartContents() {
  const { cart, items, subtotal, updateQuantity, removeItem } = useCart();
  const [busy, setBusy] = useState(null); // an item id while it is updating
  const [error, setError] = useState("");

  // runs an action, tracks which row is busy, and shows any server error
  const run = async (key, action) => {
    setBusy(key);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (!cart) return <p className="muted">Loading your cart…</p>;

  if (items.length === 0) {
    return (
      <div className="notice">
        <p>Your cart is empty.</p>
        <Link to="/categories" className="btn">Browse categories</Link>
      </div>
    );
  }

  return (
    <div className="cart">
      <ul className="cart__list">
        {items.map((item) => {
          const p = item.product;
          const img = mediaUrl(p.image);
          const disabled = busy === item.id;
          return (
            <li key={item.id} className="cart__row">
              <div className="cart__img">
                {img ? <img src={img} alt="" /> : <span>—</span>}
              </div>

              <div className="cart__info">
                <h3>{p.product_name}</h3>
                <p className="muted">{formatPrice(p.product_price)} each</p>
                <button
                  type="button"
                  className="link-btn"
                  disabled={disabled}
                  onClick={() => run(item.id, () => removeItem(item.id))}
                >
                  Remove
                </button>
              </div>

              <div className="qty" aria-label="Quantity">
                <button
                  type="button"
                  disabled={disabled || item.quantity <= 1}
                  onClick={() => run(item.id, () => updateQuantity(item.id, item.quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  disabled={disabled || item.quantity >= p.current_stock}
                  onClick={() => run(item.id, () => updateQuantity(item.id, item.quantity + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <div className="cart__line">{formatPrice(Number(p.product_price) * item.quantity)}</div>
            </li>
          );
        })}
      </ul>

      <aside className="summary">
        <h2>Order summary</h2>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
        </dl>
        <div className="summary__total">
          <span>Total</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>

        {error && <p className="product__error">{error}</p>}

        <Link to="/checkout" className="btn btn--block">Proceed to checkout</Link>
        <Link to="/categories" className="summary__more">Continue shopping</Link>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Your cart</p>
        <h1 className="page__title">Cart</h1>
      </header>
      <RequireLogin message="Log in to see your cart.">
        <CartContents />
      </RequireLogin>
    </main>
  );
}
