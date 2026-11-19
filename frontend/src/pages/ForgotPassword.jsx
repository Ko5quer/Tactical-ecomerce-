import { useState } from "react";
import { Link } from "react-router-dom";
import Field from "../components/Field";
import { api, errorMessage } from "../components/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError("");

    setBusy(true);
    try {
      await api("/api/accounts/password-reset/", {
        method: "POST",
        body: { email: value.toLowerCase() },
        auth: false,
      });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Account recovery</p>
        <h1 className="page__title">Forgot password</h1>
      </header>

      {sent ? (
        <section className="panel" style={{ maxWidth: 520 }}>
          <h2>Check your email</h2>
          <p className="muted">
            If that email has an account, we've sent a link to reset your password. The link works for 1 hour.
            Don't see it? Check your spam folder.
          </p>
          <Link to="/" className="btn">Back to the store</Link>
        </section>
      ) : (
        <form className="panel" style={{ maxWidth: 520 }} onSubmit={submit} noValidate>
          <h2>Reset your password</h2>
          <p className="muted">Enter the email you registered with and we'll send you a link to choose a new password.</p>

          <div className="fields">
            <Field
              label="Email"
              name="email"
              idPrefix="forgot"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldError}
              autoComplete="email"
              maxLength={254}
              wide
              autoFocus
            />
          </div>

          {error && <p className="product__error" role="alert">{error}</p>}

          <button type="submit" className="btn btn--block" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <Link to="/" className="summary__more">Back to the store</Link>
        </form>
      )}
    </main>
  );
}
