import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, errorMessage } from "../components/api";
import ProductCard from "../components/ProductCard";

export default function CategoryPage() {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus("loading");
    // auth:false -> public pages must not send a (possibly expired) token
    Promise.all([
      api(`/api/categories/${id}/`, { auth: false }),
      api(`/api/categories/${id}/products/`, { auth: false }),
    ])
      .then(([cat, prods]) => {
        setCategory(cat);
        setProducts(prods);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.status === 404 ? "That category doesn't exist." : errorMessage(err));
        setStatus("error");
      });
  }, [id]);

  return (
    <main className="page">
      <Link to="/categories" className="page__back">← All categories</Link>

      {status === "loading" && <p className="muted">Loading…</p>}

      {status === "error" && <div className="notice"><p>{error}</p></div>}

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
