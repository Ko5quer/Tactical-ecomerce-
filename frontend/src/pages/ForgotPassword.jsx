import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../components/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/accounts/password-reset/", {
        method: "POST",
        body: { email: email.trim() },
        auth: false,
      });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <h1>Check your email</h1>
        <p>
          If that email has an account, we've sent a link to reset your password. The link
          works for 1 hour.
        </p>
        <Link to="/">Back to the store</Link>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1>Forgot your password?</h1>
      <p>Enter your email and we'll send you a link to choose a new one.</p>

      <form onSubmit={submit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={busy || !email.trim()}>
          {busy ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
