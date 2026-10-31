import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "./api";
import ErrorNotice from "./ErrorNotice";
import ProductCard from "./ProductCard";
import { FEATURED } from "../siteConfig";

/* Random products from different categories, shown as plain product cards.
   The randomness happens on the server: GET /api/products/featured/?limit=8
   Text defaults come from siteConfig.js, or override with props. */
export default function FeaturedProducts({
  endpoint = "/api/products/featured/",
  limit = FEATURED.limit,
  eyebrow = FEATURED.eyebrow,
  title = FEATURED.title,
  subtitle = FEATURED.subtitle,
  shuffle = true, // show the "Show different picks" button
}) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | refreshing
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setStatus((s) => (s === "ready" ? "refreshing" : "loading"));
    setError("");
    // auth:false -> public data, never send a (maybe expired) login token
    api(`${endpoint}?limit=${limit}`, { auth: false })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch((err) => {
        console.warn("[FeaturedProducts] could not load products:", err);
        setError(errorMessage(err));
        setStatus("ready"); // keep whatever we already had on screen
      });
  }, [endpoint, limit]);

  useEffect(() => {
    load();
  }, [load]);

  // nothing to show and nothing went wrong: hide the section instead of leaving a gap
  if (status === "ready" && products.length === 0 && !error) return null;

  return (
    <section className="featured" aria-labelledby="featured-title">
      <div className="featured__inner">
        <header className="featured__head">
          <div>
            {eyebrow && <p className="page__eyebrow">{eyebrow}</p>}
            <h2 id="featured-title" className="page__title">{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {shuffle && products.length > 0 && (
            <button
              type="button"
              className="btn btn--small btn--ghost"
              onClick={load}
              disabled={status !== "ready"}
            >
              Show different picks
            </button>
          )}
        </header>

        {error && <ErrorNotice message={`Couldn't load featured products. ${error}`} onRetry={load} />}

        {(status === "loading" || products.length > 0) && (
          <div className={`products ${status === "refreshing" ? "is-dim" : ""}`}>
            {status === "loading"
              ? Array.from({ length: Math.min(limit, 4) }, (_, i) => (
                  <div key={i} className="product product--skeleton" aria-hidden="true" />
                ))
              : products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
