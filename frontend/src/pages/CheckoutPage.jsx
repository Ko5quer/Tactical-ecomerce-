import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useCart } from "../components/AppContext";
import ErrorNotice from "../components/ErrorNotice";
import Field from "../components/Field";
import RequireLogin from "../components/RequireLogin";
import { api, errorMessage, formatPrice, splitErrors } from "../components/api";
import { CHECKOUT_SCHEMA, useForm } from "../components/validation";
import { DELIVERY_NOTE } from "../siteConfig";

const FIELDS = ["full_name", "phone", "address", "city", "postal_code", "notes", "payment_method"];

function CheckoutForm() {
  const { user } = useAuth();
  const { cart, cartError, refresh, items, subtotal, checkout } = useCart();
  const navigate = useNavigate();

  const form = useForm(
    {
      full_name: [user.first_name, user.last_name].filter(Boolean).join(" "),
      phone: "",
      address: "",
      city: "",
      postal_code: "",
      notes: "",
    },
    CHECKOUT_SCHEMA,
    "co"
  );

  // payment options come from the server (editable in the Django admin)
  const [methods, setMethods] = useState(null);
  const [methodsError, setMethodsError] = useState("");
  const [method, setMethod] = useState("");

  const loadMethods = useCallback(() => {
    setMethodsError("");
    api("/api/orders/payment-methods/", { auth: false })
      .then((list) => {
        setMethods(list);
        setMethod((current) => current || list.find((m) => m.is_enabled)?.code || "");
      })
      .catch((err) => setMethodsError(errorMessage(err)));
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const valid = form.validateAll();
    if (!method) {
      setError("Please choose a payment method.");
      return;
    }
    if (!valid) return;

    setBusy(true);
    try {
      const details = Object.fromEntries(
        Object.entries(form.values).map(([k, v]) => [k, v.trim()])
      );
      const order = await checkout({ ...details, payment_method: method });
      // "placed" tells the order page to show the big "order received" message
      navigate(`/orders/${order.id}`, { state: { placed: true } });
    } catch (err) {
      const { fields, general } = splitErrors(err, FIELDS);
      if (fields.payment_method) {
        setError(fields.payment_method);
        delete fields.payment_method;
      } else {
        setError(general);
      }
      form.setServerErrors(fields);
      refresh(); // stock may have changed, keep the cart accurate
      setBusy(false);
    }
  };

  if (!cart) {
    return cartError ? (
      <ErrorNotice message={`We couldn't load your cart. ${cartError}`} onRetry={refresh} />
    ) : (
      <p className="muted">Loading…</p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="notice">
        <p>Your cart is empty, so there's nothing to check out.</p>
        <Link to="/categories" className="btn">Browse categories</Link>
      </div>
    );
  }

  const fieldProps = (name) => ({
    name,
    idPrefix: "co",
    value: form.values[name],
    onChange: form.setField(name),
    onBlur: form.blur(name),
    error: form.errors[name],
  });

  return (
    <form className="cart" onSubmit={submit} noValidate>
      <div>
        {/* ---------- 1. delivery ---------- */}
        <section className="panel">
          <h2><span className="step-num">1</span> Delivery details</h2>
          <div className="fields">
            <Field label="Full name" {...fieldProps("full_name")} autoComplete="name" maxLength={150} />
            <Field label="Phone number" {...fieldProps("phone")} type="tel" autoComplete="tel" maxLength={30} />
            <Field label="Street address" {...fieldProps("address")} wide autoComplete="street-address" maxLength={255} />
            <Field label="City / town" {...fieldProps("city")} autoComplete="address-level2" maxLength={100} />
            <Field
              label="Postal code (optional)"
              {...fieldProps("postal_code")}
              autoComplete="postal-code"
              maxLength={10}
            />
            <Field
              label="Order notes (optional)"
              {...fieldProps("notes")}
              as="textarea"
              rows="3"
              wide
              maxLength={500}
              hint={`${form.values.notes.length}/500`}
            />
          </div>
        </section>

        {/* ---------- 2. payment ---------- */}
        <section className="panel">
          <h2><span className="step-num">2</span> Payment method</h2>

          {methodsError && <ErrorNotice message={`Couldn't load payment options. ${methodsError}`} onRetry={loadMethods} />}
          {!methods && !methodsError && <p className="muted">Loading payment options…</p>}

          {methods?.length === 0 && (
            <p className="muted">No payment methods are available right now. Please contact us.</p>
          )}

          {methods?.map((m) => (
            <label
              key={m.code}
              className={`pay ${method === m.code ? "is-selected" : ""} ${m.is_enabled ? "" : "is-disabled"}`}
            >
              <input
                type="radio"
                name="payment"
                value={m.code}
                checked={method === m.code}
                disabled={!m.is_enabled}
                onChange={() => setMethod(m.code)}
              />
              <span className="pay__text">
                <span className="pay__label">
                  {m.label}
                  {!m.is_enabled && <span className="pay__tag">Coming soon</span>}
                </span>
                {m.description && <span className="pay__desc">{m.description}</span>}
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

        <button type="submit" className="btn btn--block" disabled={busy || !methods}>
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
