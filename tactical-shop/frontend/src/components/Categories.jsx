import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "./Categories.css";

/* ====================================================================
   DEFAULTS — everything below can be overridden with props
   ==================================================================== */

// Optional sample data: pass fallbackCategories={DEMO_CATEGORIES} to preview the design without a server.
export const DEMO_CATEGORIES = [
  { id: 1, name: "Tactical Clothing", slug: "tactical-clothing" },
  { id: 2, name: "Outdoor Gear", slug: "outdoor-gear" },
  { id: 3, name: "Firearms", slug: "firearms" },
  { id: 4, name: "Ammunition", slug: "ammunition" },
  { id: 5, name: "Accessories", slug: "accessories" },
  { id: 6, name: "Survival & Utility", slug: "survival-utility" },
  { id: 7, name: "Brands", slug: "brands" },
];

/* Maps a raw API item to the shape this component needs.
   Handles the usual field names; pass your own `mapItem` if yours differ. */
const defaultMapItem = (c, i) => {
  const img = c.image ?? c.image_url ?? c.imageUrl ?? c.thumbnail ?? c.img ?? null;
  return {
    id: c.id ?? c._id ?? c.slug ?? i,
    name: c.name ?? c.title ?? c.label ?? "Category",
    slug: c.slug ?? c.handle ?? String(c.id ?? c._id ?? i),
    image: img && typeof img === "object" ? img.url ?? img.src ?? null : img,
    icon: c.icon ?? null, // optional: "jacket" | "backpack" | "ammo" | "crosshair" | "knife" | "shield"
  };
};

const getByPath = (obj, path) =>
  path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

/* ====================================================================
   ICONS — chosen from the category name unless the item has `icon`
   ==================================================================== */
const ICONS = {
  jacket: (
    <>
      <path d="M8 3 4 6l-2 5 3 1v9h14v-9l3-1-2-5-4-3-2 2h-4z" />
      <path d="M12 5v16" />
    </>
  ),
  backpack: (
    <>
      <rect x="5" y="7" width="14" height="15" rx="4" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2M8 14h8M8 18h8" />
    </>
  ),
  ammo: (
    <>
      <path d="M3 21V10l2-4 2 4v11zM10 21V10l2-4 2 4v11zM17 21V10l2-4 2 4v11z" />
      <path d="M3 17h4M10 17h4M17 17h4" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
    </>
  ),
  knife: (
    <>
      <path d="M21 3 9 14l2 2L22 4z" />
      <path d="m10 15-6 6-1-1 5-7" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" />
      <path d="m12 8 1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8L8 10.9l2.8-.3z" />
    </>
  ),
};

const ICON_KEYWORDS = [
  [/cloth|apparel|wear|jacket/, "jacket"],
  [/ammun|ammo|bullet|cartridge/, "ammo"],
  [/firearm|gun|rifle|pistol/, "ammo"],
  [/accessor|optic|scope|sight/, "crosshair"],
  [/surviv|utility|knife|blade|tool/, "knife"],
  [/brand/, "shield"],
  [/outdoor|camp|pack|hik/, "backpack"],
];

const pickIcon = (cat) => {
  if (cat.icon && ICONS[cat.icon]) return cat.icon;
  const n = cat.name.toLowerCase();
  const hit = ICON_KEYWORDS.find(([re]) => re.test(n));
  return hit ? hit[1] : "crosshair";
};

const CategoryIcon = ({ name }) => (
  <svg
    className="cats__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICONS[name] || ICONS.crosshair}
  </svg>
);

/* ====================================================================
   BUILT-IN FALLBACK IMAGES
   Used when a category has no image and you haven't passed `fallbackImages`.
   Generated SVG textures in the same dark/orange palette — no files needed.
   ==================================================================== */
const svgUri = (inner) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">
      <rect width="300" height="400" fill="#140a05"/>${inner}</svg>`
  );

const BUILTIN_FALLBACKS = [
  // sunset ridge
  svgUri(`<circle cx="190" cy="150" r="70" fill="#d9480f" opacity=".75"/>
    <path d="M0 260l60-60 40 30 70-90 60 70 70-40v230H0z" fill="#2a1208"/>
    <path d="M0 320l80-50 70 30 90-60 60 40v120H0z" fill="#0d0603"/>`),
  // topographic lines
  svgUri(
    [30, 60, 90, 120, 150, 180]
      .map(
        (r, i) =>
          `<ellipse cx="90" cy="260" rx="${r * 1.3}" ry="${r * 0.85}" transform="rotate(${-14 + i * 4} 90 260)" fill="none" stroke="#ff6a00" stroke-opacity=".35"/>`
      )
      .join("")
  ),
  // hex grid
  svgUri(
    `<defs><pattern id="h" width="40" height="46" patternUnits="userSpaceOnUse" patternTransform="scale(1.1)">
      <path d="M20 2l17 10v22L20 44 3 34V12z" fill="none" stroke="#ff6a00" stroke-opacity=".28"/></pattern></defs>
      <rect width="300" height="400" fill="url(#h)"/>
      <rect width="300" height="400" fill="url(#g)"/>
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a00" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`
  ),
  // camo
  svgUri(`<path d="M-10 60c60-40 90 20 150 0s100-30 170 10v90c-60 30-90-20-150 0S40 190-10 150z" fill="#2c1409"/>
    <path d="M-10 230c50-30 100 20 160 0s90-20 160 20v60c-70 30-110-10-160 10s-110 10-160-20z" fill="#3a1a0b"/>
    <path d="M120 -10c30 30 80 10 110 40s20 70-20 80-90-30-100-70z" fill="#22100a"/>`),
  // diagonal slashes
  svgUri(`<path d="M300 40 60 400M300 140 160 400M300 240 250 400" stroke="#ff6a00" stroke-opacity=".4" stroke-width="2" fill="none"/>
    <circle cx="90" cy="120" r="46" fill="none" stroke="#ff6a00" stroke-opacity=".35"/>
    <path d="M90 60v120M30 120h120" stroke="#ff6a00" stroke-opacity=".25"/>`),
];

/* ====================================================================
   COMPONENT
   ==================================================================== */
export default function Categories({
  /* ---- data ---- */
  endpoint, //            e.g. "/api/categories"
  fetchOptions, //        passed to fetch(), e.g. { headers: { Authorization: "..." } }
  dataPath, //            where the array lives in the response, e.g. "data.categories"
  categories, //          pass an array directly to skip fetching
  mapItem = defaultMapItem,
  fallbackCategories = [], // shown only if the server returns an EMPTY list

  /* ---- images ---- */
  fallbackImages, //      array of image URLs/imports to use when a category has no image
  fallbackMode = "each", // "each" = random image per card, "single" = one random image for all
  mediaBase = "", //      prefix for relative image paths, e.g. "http://127.0.0.1:8000"

  /* ---- text ---- */
  eyebrow = "Shop by category",
  titleLead = "Explore our",
  titleAccent = "Categories",
  subtitle = "Everything you need for your next mission, adventure or training session.",
  ctaLabel = "Shop now",

  /* ---- behaviour ---- */
  getHref = (c) => `/categories/${c.slug}`,
  onSelect, //            (category, event) => void
  className = "",
  style, //               set CSS variables here to restyle, see Categories.css
}) {
  const [items, setItems] = useState(categories ? categories.map(mapItem) : []);
  const [status, setStatus] = useState(categories || !endpoint ? "ready" : "loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bump to retry the request

  /* ---------- fetch ---------- */
  useEffect(() => {
    if (categories) {
      setItems(categories.map(mapItem));
      setStatus("ready");
      return;
    }
    if (!endpoint) {
      setStatus("ready");
      return;
    }
    const ctrl = new AbortController();
    setStatus("loading");
    setError("");
    fetch(endpoint, { ...fetchOptions, signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
        return r.json();
      })
      .then((json) => {
        const list = dataPath
          ? getByPath(json, dataPath)
          : Array.isArray(json)
          ? json
          : json.data ?? json.categories ?? json.results ?? json.items;
        setItems(Array.isArray(list) ? list.map(mapItem) : []);
        setStatus("ready");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.warn("[Categories] could not load categories:", err);
        setItems([]);
        setError(
          err.status >= 500
            ? "The server ran into a problem loading categories."
            : err.status
            ? "We couldn't load the categories."
            : "Could not reach the server. Check your connection."
        );
        setStatus("error");
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, categories, dataPath, attempt]);

  /* ---------- fallback data + images ---------- */
  const list = items.length ? items : status === "ready" ? fallbackCategories.map(mapItem) : [];

  const pool = fallbackImages?.length ? fallbackImages : BUILTIN_FALLBACKS;
  const singlePick = useMemo(
    () => pool[Math.floor(Math.random() * pool.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool.length]
  );

  // Picked once per data change, so images don't flicker on re-render.
  const cards = useMemo(
    () =>
      list.map((c) => ({
        ...c,
        bg:
          (c.image && !/^(https?:|data:|blob:)/.test(c.image) ? mediaBase + c.image : c.image) ||
          (fallbackMode === "single"
            ? singlePick
            : pool[Math.floor(Math.random() * pool.length)]),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list.length, items, fallbackMode, singlePick]
  );

  /* ---------- carousel ---------- */
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = el.clientWidth + gap;
    const total = Math.max(1, Math.ceil((el.scrollWidth - 2 + gap) / step));
    setPages(total);
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setPage(atEnd ? total - 1 : Math.min(total - 1, Math.round(el.scrollLeft / step)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure, cards.length]);

  const goTo = (p) => {
    const el = trackRef.current;
    if (!el) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollTo({ left: p * (el.clientWidth + gap), behavior: "smooth" });
  };

  const canScroll = pages > 1;

  const showNotice = status === "error" || (status === "ready" && cards.length === 0);

  /* ---------- render ---------- */
  return (
    <section className={`cats ${className}`} style={style} aria-labelledby="cats-title">
      {/* orange-world decoration */}
      <div className="cats__scene" aria-hidden="true">
        <svg className="cats__mountains" viewBox="0 0 1200 400" preserveAspectRatio="xMaxYMin slice">
          <circle cx="760" cy="150" r="110" />
          <path d="M300 400 400 260l60 40 90-120 70 70 90-130 90 130 80-50 80 90 40 40v70z" />
        </svg>
        <svg className="cats__topo" viewBox="0 0 300 300">
          {[40, 70, 100, 130, 160].map((r, i) => (
            <ellipse key={r} cx="30" cy="270" rx={r * 1.3} ry={r * 0.8} transform={`rotate(${-12 + i * 3} 30 270)`} />
          ))}
        </svg>
        <svg className="cats__reticle" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="60" />
          <path d="M90 0v32M90 148v32M0 90h32M148 90h32" />
        </svg>
        <div className="cats__grain" />
      </div>

      <div className="cats__inner">
        <header className="cats__head">
          {eyebrow && (
            <p className="cats__eyebrow">
              <span className="cats__rule" /> {eyebrow}
            </p>
          )}
          <h2 id="cats-title" className="cats__title">
            <span>{titleLead}</span>
            <span className="cats__title--accent">{titleAccent}</span>
          </h2>
          {subtitle && <p className="cats__subtitle">{subtitle}</p>}
        </header>

        {showNotice ? (
          <div className="cats__notice" role={status === "error" ? "alert" : undefined}>
            <p>{status === "error" ? error : "No categories yet. Check back soon."}</p>
            {status === "error" && (
              <button type="button" className="cats__retry" onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </button>
            )}
          </div>
        ) : (
        <>
        <div className="cats__stage">
          <button
            type="button"
            className="cats__arrow cats__arrow--prev"
            aria-label="Previous categories"
            onClick={() => goTo(Math.max(0, page - 1))}
            disabled={!canScroll || page === 0}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 6-6 6 6 6" /></svg>
          </button>

          <ul className="cats__track" ref={trackRef} aria-live="polite">
            {status === "loading" &&
              Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="cats__item">
                  <div className="cats__card cats__card--skeleton" />
                </li>
              ))}

            {cards.map((c) => (
              <li key={c.id} className="cats__item">
                <Link
                  className="cats__card"
                  to={getHref(c)}
                  onClick={onSelect ? (e) => onSelect(c, e) : undefined}
                >
                  <span className="cats__bg" style={{ backgroundImage: `url("${c.bg}")` }} />
                  <span className="cats__shade" />
                  <span className="cats__body">
                    <CategoryIcon name={pickIcon(c)} />
                    <span className="cats__name">{c.name}</span>
                    <span className="cats__cta">
                      {ctaLabel}
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17M14 6l6 6-6 6" /></svg>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="cats__arrow cats__arrow--next"
            aria-label="Next categories"
            onClick={() => goTo(Math.min(pages - 1, page + 1))}
            disabled={!canScroll || page >= pages - 1}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 6 6 6-6 6" /></svg>
          </button>
        </div>

        {canScroll && (
          <div className="cats__dots" role="tablist" aria-label="Category pages">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === page}
                aria-label={`Page ${i + 1}`}
                className={`cats__dot ${i === page ? "is-active" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </section>
  );
}
