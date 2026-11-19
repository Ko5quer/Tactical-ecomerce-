import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Field from "../components/Field";
import { api, splitErrors } from "../components/api";
import { useAuth } from "../components/AppContext";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const { openAuth } = useAuth();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = {};
    if (password.length < 8) errors.password = "Use at least 8 characters.";
    if (confirm !== password) errors.confirm = "The two passwords don't match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

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
      if (fields.new_password) setFieldErrors({ password: fields.new_password });
      else setError(general);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Account recovery</p>
        <h1 className="page__title">New password</h1>
      </header>

      {!uid || !token ? (
        <div className="notice" style={{ maxWidth: 520 }}>
          <p>This reset link is incomplete or has expired. Please request a new one.</p>
          <Link to="/forgot-password" className="btn">Request a new link</Link>
        </div>
      ) : done ? (
        <section className="panel" style={{ maxWidth: 520 }}>
          <h2>Password updated</h2>
          <p className="muted">Your password has been changed. You can now log in with it.</p>
          <button type="button" className="btn" onClick={openAuth}>Log in</button>
        </section>
      ) : (
        <form className="panel" style={{ maxWidth: 520 }} onSubmit={submit} noValidate>
          <h2>Choose a new password</h2>

          <div className="fields">
            <Field
              label="New password"
              name="password"
              idPrefix="reset"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              hint="At least 8 characters, not only numbers."
              autoComplete="new-password"
              maxLength={128}
              wide
              autoFocus
            />
            <Field
              label="Confirm new password"
              name="confirm"
              idPrefix="reset"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={fieldErrors.confirm}
              autoComplete="new-password"
              maxLength={128}
              wide
            />
          </div>

          {error && (
            <p className="product__error" role="alert">
              {error}{" "}
              {error.includes("expired") && <Link to="/forgot-password">Request a new link</Link>}
            </p>
          )}

          <button type="submit" className="btn btn--block" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
    </main>
  );
}
