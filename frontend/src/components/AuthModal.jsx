import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AppContext";
import { errorMessage, splitErrors } from "./api";
import Field from "./Field";
import { LOGIN_SCHEMA, REGISTER_SCHEMA, useForm } from "./validation";
import "./AuthModal.css";

const EMPTY = { email: "", password: "", first_name: "", last_name: "" };

export default function AuthModal({ open, onClose }) {
  const { user, login, register, logout, authMessage } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const form = useForm(EMPTY, mode === "login" ? LOGIN_SCHEMA : REGISTER_SCHEMA, "auth");

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // start clean whenever it is opened or the tab changes
  useEffect(() => {
    if (open) {
      form.reset(EMPTY);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.validateAll()) return;

    setBusy(true);
    setError("");
    try {
      if (mode === "login") await login(form.values.email, form.values.password);
      else await register(form.values);
      onClose();
    } catch (err) {
      if (mode === "login" && err.status === 401) {
        setError("Incorrect email or password.");
      } else {
        const { fields, general } = splitErrors(err, ["email", "password", "first_name", "last_name"]);
        form.setServerErrors(fields);
        setError(general);
      }
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

            {authMessage && <p className="auth__error" role="status">{authMessage}</p>}

            <form onSubmit={submit} className="auth__form" noValidate>
              {mode === "register" && (
                <div className="auth__row">
                  <Field
                    label="First name"
                    name="first_name"
                    idPrefix="auth"
                    value={form.values.first_name}
                    onChange={form.setField("first_name")}
                    onBlur={form.blur("first_name")}
                    error={form.errors.first_name}
                    autoComplete="given-name"
                    maxLength={150}
                  />
                  <Field
                    label="Last name"
                    name="last_name"
                    idPrefix="auth"
                    value={form.values.last_name}
                    onChange={form.setField("last_name")}
                    onBlur={form.blur("last_name")}
                    error={form.errors.last_name}
                    autoComplete="family-name"
                    maxLength={150}
                  />
                </div>
              )}

              <Field
                label="Email"
                name="email"
                idPrefix="auth"
                type="email"
                value={form.values.email}
                onChange={form.setField("email")}
                onBlur={form.blur("email")}
                error={form.errors.email}
                autoComplete="email"
                maxLength={254}
                autoFocus
              />

              <Field
                label="Password"
                name="password"
                idPrefix="auth"
                type="password"
                value={form.values.password}
                onChange={form.setField("password")}
                onBlur={form.blur("password")}
                error={form.errors.password}
                hint={mode === "register" ? "At least 8 characters, not only numbers." : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                maxLength={128}
              />

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
