import { useState } from "react";
import Field from "../components/Field";
import { getSocials } from "../components/SocialLinks";
import { CONTACT_SCHEMA, useForm } from "../components/validation";
import { CONTACT } from "../siteConfig";

/* Contact details come from CONTACT in src/siteConfig.js.
   The form has no server behind it: it opens the visitor's own email app with
   the message filled in, addressed to CONTACT.email. */
export default function ContactPage() {
  const form = useForm({ name: "", email: "", message: "" }, CONTACT_SCHEMA, "contact");
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSent(false);
    if (!form.validateAll()) return;

    const { name, email, message } = form.values;
    const subject = `Message from ${name.trim()}`;
    const body = `${message.trim()}\n\n${name.trim()}\n${email.trim()}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const fieldProps = (name) => ({
    name,
    idPrefix: "contact",
    value: form.values[name],
    onChange: form.setField(name),
    onBlur: form.blur(name),
    error: form.errors[name],
  });

  return (
    <main className="page">
      <header className="page__head">
        <p className="page__eyebrow">Say hello</p>
        <h1 className="page__title">Contact us</h1>
        <p className="muted">
          Questions about an order, an event or gear? Reach us any of these ways.
          {CONTACT.location && <> We're based in {CONTACT.location}.</>}
        </p>
      </header>

      <ul className="contact-cards">
        {getSocials().map(({ key, label, value, href, Icon }) => {
          const external = !href.startsWith("mailto:");
          return (
            <li key={key}>
              <a
                href={href}
                className="contact-card"
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <span className="contact-card__icon"><Icon width="28" height="28" /></span>
                <span className="contact-card__text">
                  <strong>{label}</strong>
                  <span className="muted">{value}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      {CONTACT.email && (
        <section className="panel contact-form" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">Send us a message</h2>
          <form onSubmit={submit} noValidate>
            <div className="fields">
              <Field label="Your name" {...fieldProps("name")} autoComplete="name" maxLength={150} />
              <Field label="Your email" {...fieldProps("email")} type="email" autoComplete="email" maxLength={254} />
              <Field
                label="Message"
                {...fieldProps("message")}
                as="textarea"
                rows="5"
                wide
                maxLength={1000}
                hint={`${form.values.message.length}/1000`}
              />
            </div>
            <button type="submit" className="btn contact-form__send">Send message</button>
            {sent && (
              <p className="muted small" role="status">
                Your email app should open with the message ready to send. If nothing happens, email us directly at{" "}
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
              </p>
            )}
          </form>
        </section>
      )}
    </main>
  );
}
