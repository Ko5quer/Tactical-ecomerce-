import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, splitErrors } from "../api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!uid || !token) {
    return (
      <div className="auth-page">
        <h1>Invalid link</h1>
        <p>This reset link is incomplete. Please request a new one.</p>
        <Link to="/forgot-password">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-page">
        <h1>Password updated</h1>
        <p>You can now log in with your new password.</p>
        <Link to="/">Back to the store</Link>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setBusy(true);
    try {
      await api("/api/accounts/password-reset/confirm/", {
        method: "POST",
        body: { uid, token, new_password: password },
        auth: false,
      });
      setDone(true);
    } catch (err) {
      const { fields, general } = splitErrors(err, ["new_password"]);
      setError(fields.new_password || general);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Choose a new password</h1>

      <form onSubmit={submit}>
        <label htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <label htmlFor="confirm">Confirm new password</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={busy || !password || !confirm}>
          {busy ? "Saving..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
