import { Link } from "react-router-dom";
import SocialLinks from "../components/SocialLinks";
import { ABOUT } from "../siteConfig";

/* All the wording comes from ABOUT in src/siteConfig.js: edit it there. */
export default function AboutPage() {
  return (
    <main className="page about">
      <header className="page__head">
        <p className="page__eyebrow">{ABOUT.eyebrow}</p>
        <h1 className="page__title">{ABOUT.title}</h1>
      </header>

      <p className="about__intro">{ABOUT.intro}</p>

      {ABOUT.specialties?.length > 0 && (
        <section className="panel about__block" aria-labelledby="about-spec">
          <h2 id="about-spec">{ABOUT.specialtiesTitle}</h2>
          <ul className="about__list">
            {ABOUT.specialties.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {ABOUT.closing && <p className="about__closing">{ABOUT.closing}</p>}

      {ABOUT.affiliations?.length > 0 && (
        <section className="about__block" aria-labelledby="about-aff">
          <h2 id="about-aff" className="about__sub">{ABOUT.affiliationsTitle}</h2>
          <ul className="chips">
            {ABOUT.affiliations.map((name) => (
              <li key={name} className="chip chip--static">{name}</li>
            ))}
          </ul>
          {ABOUT.affiliationsText && <p className="muted">{ABOUT.affiliationsText}</p>}
        </section>
      )}

      <section className="about__cta">
        <div>
          <h2 className="about__sub">Get in touch</h2>
          <p className="muted">Questions, events or gear? We'd love to hear from you.</p>
        </div>
        <div className="about__actions">
          <Link to="/contact" className="btn">Contact us</Link>
          <SocialLinks />
        </div>
      </section>
    </main>
  );
}
