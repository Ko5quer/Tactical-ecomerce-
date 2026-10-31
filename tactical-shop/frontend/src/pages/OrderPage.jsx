import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import ErrorNotice from "../components/ErrorNotice";
import RequireLogin from "../components/RequireLogin";
import SafeImage from "../components/SafeImage";
import { PAYMENT_LABEL, STATUS_LABEL, api, errorMessage, formatPrice, mediaUrl } from "../components/api";
import { CONTACT, DELIVERY_NOTE } from "../siteConfig";

const STEPS = ["pending", "processing", "completed"];

/* Small "Copy" button for account numbers and references. */
function CopyButton({ text }) {
  const [state, setState] = useState("idle"); // idle | copied | failed
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1500);
  };
  return (
    <button type="button" className="copy" onClick={copy} aria-label={`Copy ${text}`}>
      {state === "copied" ? "Copied" : state === "failed" ? "Press Ctrl+C" : "Copy"}
    </button>
  );
}

/* One label/value row in the bank details table */
function Row({ label, value, copy }) {
  if (!value) return null;
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {value}
        {copy && <CopyButton text={String(value).replace(/\s/g, "")} />}
      </dd>
    </div>
  );
}

/* How to pay: loaded from the server, where the shop owner edits it. */
function PaymentPanel({ order }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setError("");
    api(`/api/orders/${order.id}/payment-instructions/`)
      .then((d) => live && setInfo(d))
      .catch((err) => live && setError(errorMessage(err)));
    return () => {
      live = false;
    };
  }, [order.id, order.payment_status, attempt]);

  if (error) {
    return (
      <section className="panel">
        <ErrorNotice message={`Couldn't load payment details. ${error}`} onRetry={() => setAttempt((a) => a + 1)} />
      </section>
    );
  }
  if (!info) {
    return <section className="panel"><p className="muted">Loading payment details…</p></section>;
  }

  const paid = info.payment_status === "paid";
  const bank = info.bank_account;

  return (
    <section className="panel">
      <h2>{info.method === "eft" ? "Pay by bank transfer" : info.label}</h2>

      {paid ? (
        <p>Payment received. Thank you!</p>
      ) : info.method === "eft" ? (
        <>
          <p className="muted">
            Please pay <strong>{formatPrice(info.amount)}</strong> to the account below. We'll process your order
            once the payment reflects.
          </p>

          {bank ? (
            <dl className="kv">
              <Row label="Bank" value={bank.bank_name} />
              <Row label="Account holder" value={bank.account_holder} />
              <Row label="Account number" value={bank.account_number} copy />
              <Row label="Account type" value={bank.account_type} />
              <Row label="Branch code" value={bank.branch_code} copy />
              <Row label="Branch" value={bank.branch_name} />
              <Row label="SWIFT code (international payments)" value={bank.swift_code} />
              <div className="kv__ref">
                <dt>Payment reference</dt>
                <dd>{info.reference}<CopyButton text={info.reference} /></dd>
              </div>
            </dl>
          ) : (
            <div className="notice notice--error">
              <p>
                Our bank details aren't available online yet. Please{" "}
                <Link to="/contact">contact us</Link> and quote <strong>{info.reference}</strong>.
              </p>
            </div>
          )}

          {bank?.proof_of_payment_email && (
            <p className="muted">
              Email your proof of payment to{" "}
              <a href={`mailto:${bank.proof_of_payment_email}?subject=${encodeURIComponent(`Proof of payment ${info.reference}`)}`}>
                {bank.proof_of_payment_email}
              </a>{" "}
              and quote <strong>{info.reference}</strong>.
            </p>
          )}

          {info.instructions && <p className="muted pre">{info.instructions}</p>}

          <p className="muted small">
            Only use the banking details shown on this page. If an email or message shows different details, contact us
            before paying.
          </p>
        </>
      ) : info.method === "cod" ? (
        <p className="muted pre">
          {info.instructions || `Please have ${formatPrice(info.amount)} ready when your order arrives.`}
        </p>
      ) : (
        <p className="muted pre">{info.instructions || "Awaiting payment."}</p>
      )}
    </section>
  );
}

function OrderDetails() {
  const { id } = useParams();
  const { state } = useLocation();
  const justPlaced = Boolean(state?.placed);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setError("");
    api(`/api/orders/${id}/`)
      .then(setOrder)
      .catch((err) => setError(err.status === 404 ? "We couldn't find that order." : errorMessage(err)));
  }, [id, attempt]);

  if (error) {
    return <ErrorNotice message={error} onRetry={error.includes("couldn't find") ? undefined : () => setAttempt((a) => a + 1)} />;
  }
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
              <strong>{order.reference}</strong> is in.{" "}
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
              {order.order_items.map((item) => (
                <li key={item.id} className="cart__row cart__row--order">
                  <div className="cart__img"><SafeImage src={mediaUrl(item.product.image)} fallback="—" /></div>
                  <div className="cart__info">
                    <h3>{item.product.product_name}</h3>
                    <p className="muted">{item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <div className="cart__line">{formatPrice(Number(item.price) * item.quantity)}</div>
                </li>
              ))}
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
              {order.notes && <p className="muted small pre">Notes: {order.notes}</p>}
              <p className="muted small">{DELIVERY_NOTE}</p>
            </section>
          )}
        </div>

        <aside className="summary">
          <h2>{order.reference}</h2>
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
            Questions? <Link to="/contact">Contact us</Link>
            {CONTACT.email && <> or email {CONTACT.email}</>}.
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
