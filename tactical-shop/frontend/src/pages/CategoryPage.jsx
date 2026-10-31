import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ErrorNotice from "../components/ErrorNotice";
import ProductCard from "../components/ProductCard";
import { api, errorMessage } from "../components/api";

export default function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState({ message: "", retry: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setStatus("loading");
    // auth:false -> public pages must not send a (possibly expired) token
    Promise.all([
      api(`/api/categories/${id}/`, { auth: false }),
      api(`/api/categories/${id}/products/`, { auth: false }),
    ])
      .then(([cat, prods]) => {
        if (!live) return;
        setCategory(cat);
        setProducts(prods);
        setStatus("ready");
      })
      .catch((err) => {
        if (!live) return;
        const missing = err.status === 404;
        setError({ message: missing ? "That category doesn't exist." : errorMessage(err), retry: !missing });
        setStatus("error");
      });
    return () => {
      live = false;
    };
  }, [id, attempt]);

  return (
    <main className="page">
      <Link to="/categories" className="page__back">← All categories</Link>

      {status === "loading" && <p className="muted">Loading…</p>}

      {status === "error" && (
        <ErrorNotice message={error.message} onRetry={error.retry ? () => setAttempt((a) => a + 1) : undefined} />
      )}

      {status === "ready" && (
        <>
          <header className="page__head">
            <p className="page__eyebrow">Category</p>
            <h1 className="page__title">{category.name}</h1>
            <p className="muted">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </header>

          {products.length === 0 ? (
            <div className="notice">
              <p>Nothing here yet. Check back soon.</p>
            </div>
          ) : (
            <div className="products">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
