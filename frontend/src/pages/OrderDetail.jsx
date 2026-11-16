import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  api,
  errorMessage,
  formatPrice,
  startPayfast,
  PAYMENT_LABEL,
  STATUS_LABEL,
} from "../api";

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const payment = params.get("payment"); // "success" | "cancelled" | null

  const [order, setOrder] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const tries = useRef(0);

  const load = useCallback(async () => {
    try {
      const data = await api(`/api/orders/${id}/`);
      setOrder(data);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // After PayFast sends the customer back, the payment confirmation can arrive
  // a few seconds later, so check again every 3 seconds (up to 10 times).
  useEffect(() => {
    if (payment !== "success" || !order || order.payment_status === "paid") return;
    if (tries.current >= 10) return;
    const t = setTimeout(() => {
      tries.current += 1;
      load();
    }, 3000);
    return () => clearTimeout(t);
  }, [payment, order, load]);

  // Bank details / instructions for COD and EFT orders
  const method = order?.payment_method;
  const payStatus = order?.payment_status;
  useEffect(() => {
    if (!method || method === "card") return;
    api(`/api/orders/${id}/payment-instructions/`)
      .then(setInstructions)
      .catch(() => {});
  }, [id, method, payStatus]);

  async function payNow() {
    setPaying(true);
    setError("");
    try {
      await startPayfast(order.id); // leaves the site
    } catch (e) {
      setError(errorMessage(e));
      setPaying(false);
    }
  }

  if (!order) {
    return <div className="order-page">{error ? <p className="form-error">{error}</p> : <p>Loading...</p>}</div>;
  }

  const unpaid = order.payment_status !== "paid";
  const cancelled = order.status === "cancelled";
  const canPayByCard = order.payment_method === "card" && unpaid && !cancelled;
  const bank = instructions?.bank_account;

  return (
    <div className="order-page">
      <h1>Order {order.reference}</h1>

      {payment === "success" && !unpaid && (
        <p className="notice notice-success">Payment received. Thank you!</p>
      )}
      {payment === "success" && unpaid && (
        <p className="notice">
          Thanks! We're confirming your payment with PayFast. This page updates by itself,
          and you'll get an email once it's confirmed.
        </p>
      )}
      {payment === "cancelled" && unpaid && (
        <p className="notice notice-warning">
          Payment was cancelled. Your order is saved, and you can pay below whenever you're ready.
        </p>
      )}

      {error && <p className="form-error">{error}</p>}

      <p>
        Status: <strong>{STATUS_LABEL[order.status] || order.status}</strong>
        {" | "}
        Payment: <strong>{PAYMENT_LABEL[order.payment_method] || order.payment_method}</strong>
        {" ("}
        {order.payment_status === "paid" ? "Paid" : "Unpaid"}
        {")"}
      </p>

      {canPayByCard && (
        <button type="button" onClick={payNow} disabled={paying}>
          {paying ? "Redirecting to PayFast..." : "Pay now"}
        </button>
      )}

      {order.payment_method !== "card" && unpaid && !cancelled && instructions && (
        <section className="payment-instructions">
          <h2>How to pay</h2>
          {instructions.instructions && <p>{instructions.instructions}</p>}
          {bank && (
            <ul>
              <li>Bank: {bank.bank_name}</li>
              <li>Account holder: {bank.account_holder}</li>
              <li>Account number: {bank.account_number}</li>
              <li>Branch code: {bank.branch_code}</li>
              <li>Account type: {bank.account_type}</li>
              <li>
                Reference: <strong>{instructions.reference}</strong>
              </li>
              <li>
                Amount: <strong>{formatPrice(instructions.amount)}</strong>
              </li>
              {bank.proof_of_payment_email && (
                <li>Send proof of payment to: {bank.proof_of_payment_email}</li>
              )}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2>Items</h2>
        <ul>
          {order.order_items.map((item) => (
            <li key={item.id}>
              {item.product?.product_name} x {item.quantity} -{" "}
              {formatPrice(Number(item.price) * item.quantity)}
            </li>
          ))}
        </ul>
        <p>
          Total: <strong>{formatPrice(order.total)}</strong>
        </p>
      </section>

      <section>
        <h2>Delivery</h2>
        <p>
          {order.full_name}
          <br />
          {order.address}, {order.city} {order.postal_code}
          <br />
          {order.phone}
        </p>
      </section>

      <Link to="/orders">All my orders</Link>
    </div>
  );
}
