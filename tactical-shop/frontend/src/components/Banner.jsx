import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Banner.css";
import logo from "./logo.png"; // <-- change to your logo's actual filename
import { HERO, NAV_LINKS, SITE } from "../siteConfig"; // edit menu + text there

/* ---------- small inline icons (no extra packages needed) ---------- */
const Icon = ({ children, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7.5" />
    <path d="M16.5 16.5 21 21" />
  </Icon>
);
const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 21c0-4.2 3.4-7 7.5-7s7.5 2.8 7.5 7" />
  </Icon>
);
const CartIcon = () => (
  <Icon>
    <path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
    <circle cx="9.5" cy="20" r="1.2" />
    <circle cx="17" cy="20" r="1.2" />
  </Icon>
);
const ArrowIcon = () => (
  <Icon width="22" height="22" strokeWidth="2">
    <path d="M3 12h17M14 6l6 6-6 6" />
  </Icon>
);

/* ---------- the CSS-free "photo": layered SVG scenery ---------- */
function Scenery() {
  return (
    <div className="banner__scene" aria-hidden="true">
      <div className="banner__glow" />
      <div className="banner__cloud banner__cloud--a" />
      <div className="banner__cloud banner__cloud--b" />

      {/* Mountains + sun. "slice" keeps the peak anchored bottom-right on any screen. */}
      <svg
        className="banner__mountains"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMaxYMax slice"
      >
        <defs>
          <linearGradient id="ridgeFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a2a07" />
            <stop offset="1" stopColor="#1a0b05" />
          </linearGradient>
          <linearGradient id="ridgeMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b1208" />
            <stop offset="1" stopColor="#0a0605" />
          </linearGradient>
          <radialGradient id="sunFill" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#ff7a1a" />
            <stop offset="1" stopColor="#e24e00" />
          </radialGradient>
        </defs>

        <circle cx="700" cy="300" r="150" fill="url(#sunFill)" />

        <path
          fill="url(#ridgeFar)"
          d="M0 600V430l110-45 100 30 120-80 90 40 110-90 90 55 90-100 70 40 70-60 80-95 55 55 60 40 70 60 70 35 65 40V600Z"
        />
        {/* highlight facets on the main peak */}
        <path
          fill="#ff6a13"
          opacity=".18"
          d="M880 175l-45 78 55 20 40-60Z M880 175l60 60 25 45-45-20Z"
        />
        <path
          fill="url(#ridgeMid)"
          d="M0 600V505l150-35 150 30 150-70 150 30 160-80 140 25 150-45 150 40V600Z"
        />
        <path
          fill="#070504"
          d="M0 600v-45l200-20 220-18 220 25 220-45 200 20 140-30V600Z"
        />
      </svg>

      {/* Topographic contour lines — workshop / map-table feel */}
      <svg className="banner__topo banner__topo--left" viewBox="0 0 300 300">
        {[40, 70, 100, 130, 160].map((r, i) => (
          <ellipse
            key={r}
            cx="30"
            cy="270"
            rx={r * 1.3}
            ry={r * 0.8}
            transform={`rotate(${-12 + i * 3} 30 270)`}
          />
        ))}
      </svg>
      <svg className="banner__topo banner__topo--right" viewBox="0 0 300 300">
        {[35, 65, 95, 125].map((r, i) => (
          <ellipse
            key={r}
            cx="270"
            cy="250"
            rx={r * 1.1}
            ry={r * 0.9}
            transform={`rotate(${20 - i * 4} 270 250)`}
          />
        ))}
      </svg>

      {/* Reticle */}
      <svg className="banner__reticle" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="60" />
        <path d="M90 0v32M90 148v32M0 90h32M148 90h32" />
        <path d="M90 78v24M78 90h24" strokeDasharray="3 5" />
      </svg>

      {/* Slashes */}
      <svg className="banner__slashes" viewBox="0 0 300 300" preserveAspectRatio="none">
        <path d="M300 30 40 300" />
        <path d="M300 130 150 300" />
        <path d="M300 220 230 300" />
      </svg>

      <div className="banner__grain" />
      <div className="banner__fade" />
    </div>
  );
}

/* ================================================================== */
export default function Banner({
  compact = false, //     true = slim header only (used on every page except home)
  cartCount = 0,
  shopHref = HERO.buttonHref,
  onSearch,
  onAccount,
  onCart,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <section className={`banner ${compact ? "banner--compact" : ""}`}>
      <Scenery />

      {/* ---------------- header ---------------- */}
      <header className="banner__header">
        <div className="banner__bar">
          <Link to="/" className="banner__logo" aria-label="Home">
            <img src={logo} alt={`${SITE.name} logo`} />
          </Link>

          <nav
            id="banner-nav"
            className={`banner__nav ${menuOpen ? "is-open" : ""}`}
            aria-label="Main"
          >
            {NAV_LINKS.map(({ label, href, external }) =>
              external || /^https?:\/\//.test(href) ? (
                <a
                  key={label}
                  href={href}
                  className="banner__link"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  className={`banner__link ${isActive(href) ? "is-active" : ""}`}
                  aria-current={isActive(href) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              )
            )}
          </nav>

          <div className="banner__actions">
            <button type="button" className="banner__icon" aria-label="Search" onClick={onSearch}>
              <SearchIcon />
            </button>
            <button type="button" className="banner__icon" aria-label="Account" onClick={onAccount}>
              <UserIcon />
            </button>
            <button
              type="button"
              className="banner__icon banner__cart"
              aria-label={`Cart, ${cartCount} items`}
              onClick={onCart}
            >
              <CartIcon />
              <span className="banner__badge">{cartCount}</span>
            </button>

            <button
              type="button"
              className={`banner__burger ${menuOpen ? "is-open" : ""}`}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="banner-nav"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- hero copy ---------------- */}
      {!compact && (
      <div className="banner__content">
        <p className="banner__eyebrow">{HERO.eyebrow}</p>
        <h1 className="banner__title">
          <span>{HERO.titleLead}</span>
          <span className="banner__title--accent">{HERO.titleAccent}</span>
        </h1>
        <p className="banner__text">{HERO.text}</p>
        <Link to={shopHref} className="banner__cta">
          {HERO.buttonLabel} <ArrowIcon />
        </Link>
      </div>
      )}
    </section>
  );
}
