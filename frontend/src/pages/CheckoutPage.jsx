import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useCart } from "../components/AppContext";
import RequireLogin from "../components/RequireLogin";
import { errorMessage, formatPrice } from "../components/api";
import { DELIVERY_NOTE, PAYMENT_METHODS } from "../siteConfig";

function CheckoutForm() {
  const { user } = useAuth();
  const { cart, items, subtotal, checkout } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: [user.first_name, user.last_name].filter(Boolean).join(" "),
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    notes: "",
  });
  const [method, setMethod] = useState(PAYMENT_METHODS.find((m) => m.enabled)?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const order = await checkout({ ...form, payment_method: method });
      // "placed" tells the order page to show the big "order received" message
      navigate(`/orders/${order.id}`, { state: { placed: true } });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (!cart) return <p className="muted">Loading…</p>;

  if (items.length === 0) {
    return (
      <div className="notice">
        <p>Your cart is empty, so there's nothing to check out.</p>
        <Link to="/categories" className="btn">Browse categories</Link>
      </div>
    );
  }

  return (
    <form className="cart" onSubmit={submit}>
      <div>
        {/* ---------- 1. delivery ---------- */}
        <section className="panel">
          <h2><span className="step-num">1</span> Delivery details</h2>
          <div className="fields">
            <label className="field">
              Full name
             <input
              required
              type="text"
              value={form.full_name}
              onChange={set("full_name")}
              pattern="[A-Za-zÀ-ÿ]+([ '-][A-Za-zÀ-ÿ]+)*"
              title="Enter a valid name using letters."
              autoComplete="name"
            />
            </label>
            <label className="field">
              Phone number
              <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  pattern="0[0-9]{9}"
                  maxLength={10}
                  minLength={10}
                  title="Enter a valid 10-digit South African phone number."
                  placeholder="e.g. 0821234567"
                  autoComplete="tel"
               />
            </label>
            <label className="field field--wide">
              Street address
              <input
                  required
                  type="text"
                  minLength={5}
                  value={form.address}
                  onChange={set("address")}
                  autoComplete="street-address"
                />
            </label>
            <label className="field">
              City / town
              <input
                  required
                  type="text"
                  value={form.city}
                  onChange={set("city")}
                  pattern="[A-Za-zÀ-ÿ]+([ '-][A-Za-zÀ-ÿ]+)*"
                  title="Enter a valid city or town name."
                  autoComplete="address-level2"
                />
            </label>
            <label className="field">
              Postal code
              <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={form.postal_code}
                  onChange={set("postal_code")}
                  pattern="[0-9]{4}"
                  maxLength={4}
                  title="Enter a valid 4-digit postal code."
                  placeholder="e.g. 0181"
                  autoComplete="postal-code"
                />
            </label>
            <label className="field field--wide">
              Order notes (optional)
              <textarea rows="3" value={form.notes} onChange={set("notes")} />
            </label>
          </div>
        </section>

        {/* ---------- 2. payment ---------- */}
        <section className="panel">
          <h2><span className="step-num">2</span> Payment method</h2>
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.id}
              className={`pay ${method === m.id ? "is-selected" : ""} ${m.enabled ? "" : "is-disabled"}`}
            >
              <input
                type="radio"
                name="payment"
                value={m.id}
                checked={method === m.id}
                disabled={!m.enabled}
                onChange={() => setMethod(m.id)}
              />
              <span className="pay__text">
                <span className="pay__label">
                  {m.label}
                  {!m.enabled && <span className="pay__tag">Coming soon</span>}
                </span>
                <span className="pay__desc">{m.description}</span>
              </span>
            </label>
          ))}
        </section>
      </div>

      {/* ---------- 3. review ---------- */}
      <aside className="summary">
        <h2>Your order</h2>
        <ul className="mini">
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.quantity} × {item.product.product_name}</span>
              <span>{formatPrice(Number(item.product.product_price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="summary__total">
          <span>Total</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        <p className="muted small">{DELIVERY_NOTE}</p>

        {error && <p className="product__error" role="alert">{error}</p>}

        <button type="submit" className="btn btn--block" disabled={busy || !method}>
          {busy ? "Placing order…" : "Place order"}
        </button>
        <Link to="/cart" className="summary__more">Back to cart</Link>
      </aside>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Almost there</p>
        <h1 className="page__title">Checkout</h1>
      </header>
      <RequireLogin message="Log in to check out.">
        <CheckoutForm />
      </RequireLogin>
    </main>
  );
}
