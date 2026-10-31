import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import RequireLogin from "../components/RequireLogin";
import {
  PAYMENT_LABEL,
  STATUS_LABEL,
  api,
  errorMessage,
  formatPrice,
  mediaUrl,
  orderRef,
} from "../components/api";
import { BANK_DETAILS, DELIVERY_NOTE, STORE_CONTACT } from "../siteConfig";

const STEPS = ["pending", "processing", "completed"];

function PaymentPanel({ order }) {
  const ref = orderRef(order.id);
  const paid = order.payment_status === "paid";

  if (order.payment_method === "eft") {
    return (
      <section className="panel">
        <h2>Pay by bank transfer</h2>
        {paid ? (
          <p>Payment received. Thank you!</p>
        ) : (
          <>
            <p className="muted">
              Please pay <strong>{formatPrice(order.total)}</strong> using the details below.
              We'll process your order once the payment reflects.
            </p>
            <dl className="kv">
              {Object.entries(BANK_DETAILS).map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
              <div className="kv__ref"><dt>Payment reference</dt><dd>{ref}</dd></div>
            </dl>
            <p className="muted small">Use the reference exactly as shown so we can match your payment.</p>
          </>
        )}
      </section>
    );
  }

  if (order.payment_method === "cod") {
    return (
      <section className="panel">
        <h2>Cash on delivery</h2>
        <p className="muted">
          {paid
            ? "Payment received. Thank you!"
            : <>Please have <strong>{formatPrice(order.total)}</strong> ready when your order arrives.</>}
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>{PAYMENT_LABEL[order.payment_method] ?? "Payment"}</h2>
      <p className="muted">{paid ? "Payment received. Thank you!" : "Awaiting payment."}</p>
    </section>
  );
}

function OrderDetails() {
  const { id } = useParams();
  const { state } = useLocation();
  const justPlaced = Boolean(state?.placed);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/orders/${id}/`)
      .then(setOrder)
      .catch((err) => setError(err.status === 404 ? "Order not found." : errorMessage(err)));
  }, [id]);

  if (error) return <div className="notice"><p>{error}</p></div>;
  if (!order) return <p className="muted">Loading…</p>;

  const cancelled = order.status === "cancelled";
  const stepIndex = STEPS.indexOf(order.status);

  return (
    <>
      {justPlaced && (
        <div className="success" role="status">
          <span className="success__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <div>
            <h2>Order received!</h2>
            <p>
              Thank you{order.full_name ? `, ${order.full_name.split(" ")[0]}` : ""}. Your order{" "}
              <strong>{orderRef(order.id)}</strong> is in.{" "}
              {order.payment_method === "eft"
                ? "Pay with the bank details below and we'll get it moving."
                : "We'll be in touch to arrange delivery."}
            </p>
          </div>
        </div>
      )}

      <div className="cart">
        <div>
          {/* ---------- status tracker ---------- */}
          {cancelled ? (
            <div className="notice"><p>This order was cancelled.</p></div>
          ) : (
            <ol className="tracker" aria-label="Order progress">
              {STEPS.map((s, i) => (
                <li key={s} className={i <= stepIndex ? "is-done" : ""}>
                  {STATUS_LABEL[s]}
                </li>
              ))}
            </ol>
          )}

          {!cancelled && <PaymentPanel order={order} />}

          {/* ---------- items ---------- */}
          <section className="panel">
            <h2>Items</h2>
            <ul className="cart__list">
              {order.order_items.map((item) => {
                const img = mediaUrl(item.product.image);
                return (
                  <li key={item.id} className="cart__row cart__row--order">
                    <div className="cart__img">{img ? <img src={img} alt="" /> : <span>—</span>}</div>
                    <div className="cart__info">
                      <h3>{item.product.product_name}</h3>
                      <p className="muted">{item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <div className="cart__line">{formatPrice(Number(item.price) * item.quantity)}</div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ---------- delivery ---------- */}
          {order.address && (
            <section className="panel">
              <h2>Delivery details</h2>
              <p className="addr">
                {order.full_name}<br />
                {order.address}<br />
                {order.city}{order.postal_code ? `, ${order.postal_code}` : ""}<br />
                {order.phone}
              </p>
              {order.notes && <p className="muted small">Notes: {order.notes}</p>}
              <p className="muted small">{DELIVERY_NOTE}</p>
            </section>
          )}
        </div>

        <aside className="summary">
          <h2>{orderRef(order.id)}</h2>
          <dl>
            <div><dt>Status</dt><dd><span className={`badge badge--${order.status}`}>{STATUS_LABEL[order.status]}</span></dd></div>
            <div><dt>Placed</dt><dd>{new Date(order.created_at).toLocaleDateString()}</dd></div>
            <div><dt>Payment</dt><dd>{PAYMENT_LABEL[order.payment_method]}</dd></div>
            <div><dt>Payment status</dt><dd className="cap">{order.payment_status}</dd></div>
          </dl>
          <div className="summary__total">
            <span>Total</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
          <p className="muted small">
            Questions? {STORE_CONTACT.email} · {STORE_CONTACT.phone}
          </p>
          <Link to="/categories" className="btn btn--block">Keep shopping</Link>
          <Link to="/orders" className="summary__more">All my orders</Link>
        </aside>
      </div>
    </>
  );
}

export default function OrderPage() {
  return (
    <main className="page">
      <Link to="/orders" className="page__back">← My orders</Link>
      <RequireLogin message="Log in to view this order.">
        <OrderDetails />
      </RequireLogin>
    </main>
  );
}
