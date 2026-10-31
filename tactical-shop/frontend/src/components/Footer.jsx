import { Link } from "react-router-dom";
import { CONTACT, NAV_LINKS, SITE } from "../siteConfig";
import SocialLinks from "./SocialLinks";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <strong>{SITE.name}</strong>
          {SITE.tagline && <p className="muted">{SITE.tagline}</p>}
          {CONTACT.location && <p className="muted small">{CONTACT.location}</p>}
        </div>

        <nav aria-label="Footer">
          <ul className="footer__links">
            {NAV_LINKS.filter((l) => !l.external && !/^https?:/.test(l.href)).map((l) => (
              <li key={l.label}><Link to={l.href}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <SocialLinks />
      </div>

      <p className="footer__copy muted small">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </p>
    </footer>
  );
}
