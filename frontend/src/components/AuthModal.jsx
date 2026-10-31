import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AppContext";
import { errorMessage } from "./api";
import "./AuthModal.css";

const EMPTY = { email: "", password: "", first_name: "", last_name: "" };

export default function AuthModal({ open, onClose }) {
  const { user, login, register, logout } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // reset the form whenever it's reopened
  useEffect(() => {
    if (open) {
      setError("");
      setForm(EMPTY);
    }
  }, [open, mode]);

  if (!open) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth__panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth__close" onClick={onClose} aria-label="Close">×</button>

        {user ? (
          /* ---------- signed in ---------- */
          <>
            <p className="auth__eyebrow">Account</p>
            <h2 id="auth-title" className="auth__title">
              {user.first_name ? `Hi, ${user.first_name}` : "Signed in"}
            </h2>
            <p className="auth__sub">{user.email}</p>
            <Link to="/orders" className="auth__link" onClick={onClose}>
              My orders
            </Link>
            <button
              className="auth__submit"
              onClick={() => {
                logout();
                onClose();
              }}
            >
              Log out
            </button>
          </>
        ) : (
          /* ---------- logged out ---------- */
          <>
            <p className="auth__eyebrow">{mode === "login" ? "Welcome back" : "Join up"}</p>
            <h2 id="auth-title" className="auth__title">
              {mode === "login" ? "Log in" : "Create account"}
            </h2>

            <form onSubmit={submit} className="auth__form">
              {mode === "register" && (
                <div className="auth__row">
                  <label>
                    First name
                    <input value={form.first_name} onChange={set("first_name")} autoComplete="given-name" />
                  </label>
                  <label>
                    Last name
                    <input value={form.last_name} onChange={set("last_name")} autoComplete="family-name" />
                  </label>
                </div>
              )}
              <label>
                Email
                <input type="email" required autoFocus value={form.email} onChange={set("email")} autoComplete="email" />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={set("password")}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </label>

              {error && <p className="auth__error" role="alert">{error}</p>}

              <button className="auth__submit" disabled={busy}>
                {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
              </button>
            </form>

            <p className="auth__switch">
              {mode === "login" ? "No account yet?" : "Already registered?"}{" "}
              <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
