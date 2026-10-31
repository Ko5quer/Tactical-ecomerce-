import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RequireLogin from "../components/RequireLogin";
import { STATUS_LABEL, api, errorMessage, formatPrice, orderRef } from "../components/api";

function OrderList() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/orders/")
      .then(setOrders)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="notice"><p>{error}</p></div>;
  if (!orders) return <p className="muted">Loading…</p>;

  if (orders.length === 0) {
    return (
      <div className="notice">
        <p>You haven't placed any orders yet.</p>
        <Link to="/categories" className="btn">Start shopping</Link>
      </div>
    );
  }

  return (
    <ul className="orders">
      {orders.map((o) => {
        const units = o.order_items.reduce((n, i) => n + i.quantity, 0);
        return (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`} className="orders__row">
              <div>
                <strong>{orderRef(o.id)}</strong>
                <span className="muted small">
                  {new Date(o.created_at).toLocaleDateString()} · {units} {units === 1 ? "item" : "items"}
                </span>
              </div>
              <span className={`badge badge--${o.status}`}>{STATUS_LABEL[o.status]}</span>
              <strong className="orders__total">{formatPrice(o.total)}</strong>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Your account</p>
        <h1 className="page__title">My orders</h1>
      </header>
      <RequireLogin message="Log in to see your orders.">
        <OrderList />
      </RequireLogin>
    </main>
  );
}
