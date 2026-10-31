import { useAuth } from "./AppContext";

/* Wrap any page content that needs a logged-in user. */
export default function RequireLogin({ children, message = "Log in to continue." }) {
  const { user, loading, openAuth } = useAuth();

  if (loading) return <p className="muted">Loading…</p>;

  if (!user) {
    return (
      <div className="notice">
        <p>{message}</p>
        <button type="button" className="btn" onClick={openAuth}>
          Log in / Sign up
        </button>
      </div>
    );
  }
  return children;
}
