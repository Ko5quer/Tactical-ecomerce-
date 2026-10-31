import { Component } from "react";
import { Link } from "react-router-dom";

/* Catches a crash while drawing a page, so one bug shows a friendly message
   instead of a blank white screen. Layout re-creates it on every page change. */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] page crashed:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page">
        <div className="notice notice--error" role="alert">
          <p>Something went wrong while showing this page.</p>
          <div className="notice__actions">
            <button type="button" className="btn btn--small" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <Link to="/" className="btn btn--small btn--ghost">Go home</Link>
          </div>
        </div>
      </main>
    );
  }
}
