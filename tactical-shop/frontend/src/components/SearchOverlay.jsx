import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* The box that opens when the magnifying glass in the banner is clicked. */
export default function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    setError("");
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim().replace(/\s+/g, " ");
    if (term.length < 2) {
      setError("Type at least 2 characters to search.");
      inputRef.current?.focus();
      return;
    }
    onClose();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="search" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="search__panel" role="search" onSubmit={submit} noValidate>
        <label className="search__label" htmlFor="site-search">Search the shop</label>
        <div className="search__row">
          <input
            id="site-search"
            ref={inputRef}
            type="search"
            value={q}
            maxLength={100}
            placeholder="Search products or categories…"
            autoComplete="off"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "site-search-error" : undefined}
            onChange={(e) => {
              setQ(e.target.value);
              if (error) setError("");
            }}
          />
          <button type="submit" className="btn">Search</button>
        </div>
        {error && <p className="field__error" id="site-search-error" role="alert">{error}</p>}
        <button type="button" className="search__close" onClick={onClose} aria-label="Close search">×</button>
      </form>
    </div>
  );
}
