import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ErrorNotice from "../components/ErrorNotice";
import ProductCard from "../components/ProductCard";
import { api, errorMessage } from "../components/api";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 100);

  const [input, setInput] = useState(q);
  const [inputError, setInputError] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    if (q.length < 2) {
      setStatus("idle");
      setData(null);
      return;
    }
    let live = true;
    setStatus("loading");
    api(`/api/products/search/?q=${encodeURIComponent(q)}`, { auth: false })
      .then((d) => {
        if (!live) return;
        setData(d);
        setStatus("ready");
      })
      .catch((err) => {
        if (!live) return;
        setError(errorMessage(err));
        setStatus("error");
      });
    return () => {
      live = false;
    };
  }, [q, attempt]);

  const submit = (e) => {
    e.preventDefault();
    const term = input.trim().replace(/\s+/g, " ");
    if (term.length < 2) {
      setInputError("Type at least 2 characters to search.");
      return;
    }
    setInputError("");
    setParams({ q: term });
  };

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];

  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Search</p>
        <h1 className="page__title">{q.length >= 2 ? `Results for “${q}”` : "Search the shop"}</h1>
      </header>

      <form className="search__inline" onSubmit={submit} role="search" noValidate>
        <input
          type="search"
          value={input}
          maxLength={100}
          placeholder="Search products or categories…"
          aria-label="Search"
          aria-invalid={inputError ? "true" : undefined}
          onChange={(e) => {
            setInput(e.target.value);
            if (inputError) setInputError("");
          }}
        />
        <button type="submit" className="btn">Search</button>
      </form>
      {inputError && <p className="field__error" role="alert">{inputError}</p>}

      {status === "idle" && <p className="muted">Type a product or category name to get started.</p>}
      {status === "loading" && <p className="muted">Searching…</p>}
      {status === "error" && <ErrorNotice message={`Search failed. ${error}`} onRetry={() => setAttempt((a) => a + 1)} />}

      {status === "ready" && (
        <>
          {categories.length > 0 && (
            <div className="chips" aria-label="Matching categories">
              <span className="muted small">Categories:</span>
              {categories.map((c) => (
                <Link key={c.id} to={`/categories/${c.id}`} className="chip">{c.name}</Link>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="notice">
              <p>No products matched “{q}”. Try a different word, or browse the categories.</p>
              <Link to="/categories" className="btn">Browse categories</Link>
            </div>
          ) : (
            <>
              <p className="muted search__count">
                {products.length} {products.length === 1 ? "product" : "products"} found
              </p>
              <div className="products">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
