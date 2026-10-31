import { CONTACT } from "../siteConfig";

/* Simple outline icons, drawn as SVG so they scale and take any colour. */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

export const MailIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const InstagramIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const FacebookIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const WhatsAppIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 21l1.7-5A9 9 0 1 1 8 19.3L3 21z" />
    <path d="M9 8.6c0 3.3 2.8 6.1 6.1 6.1l1.2-1.4-2.1-1.1-.9.7a4.6 4.6 0 0 1-2.3-2.3l.7-.9L10.6 7 9 8.6z" />
  </svg>
);

/* Built from CONTACT in siteConfig.js: leave a value out there and its icon disappears. */
export function getSocials() {
  return [
    CONTACT.email && {
      key: "email",
      label: "Email",
      value: CONTACT.email,
      href: `mailto:${CONTACT.email}`,
      Icon: MailIcon,
    },
    CONTACT.whatsapp && {
      key: "whatsapp",
      label: "WhatsApp",
      value: CONTACT.whatsappDisplay || "Chat with us",
      href: CONTACT.whatsapp,
      Icon: WhatsAppIcon,
    },
    CONTACT.instagram && {
      key: "instagram",
      label: "Instagram",
      value: CONTACT.instagramHandle || "Follow us",
      href: CONTACT.instagram,
      Icon: InstagramIcon,
    },
    CONTACT.facebook && {
      key: "facebook",
      label: "Facebook",
      value: CONTACT.facebookLabel || "Join our group",
      href: CONTACT.facebook,
      Icon: FacebookIcon,
    },
  ].filter(Boolean);
}

/* Row of round icon buttons (used in the footer and on the About page). */
export default function SocialLinks({ className = "" }) {
  return (
    <ul className={`socials ${className}`}>
      {getSocials().map(({ key, label, href, Icon }) => {
        const external = !href.startsWith("mailto:");
        return (
          <li key={key}>
            <a
              href={href}
              aria-label={label}
              title={label}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              <Icon width="22" height="22" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
