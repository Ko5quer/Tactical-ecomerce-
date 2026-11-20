/* =====================================================================
   SITE CONFIG: the one file to edit for everyday changes.
   Menu links, banner text, About text, contact details and social links
   all live here.

   (Payment details such as bank account info are NOT here: they are
   stored on the server and edited in the Django admin. See README.)
   ===================================================================== */

export const SITE = {
  name: "TacArms",
  tagline: "Gear up",
};

/* ---------------------------------------------------------------------
   TOP MENU
   Each entry becomes a link in the banner (and in the mobile menu + footer).
   Order here = order on screen.

   To add a page:
     1. create the page file in src/pages/        (e.g. FaqPage.jsx)
     2. add a <Route> for it in src/App.jsx
     3. add a line below

   Fields:
     label     text shown in the menu
     href      where it goes ("/about", or a full https:// link)
     external  (optional) true = open in a new tab, for other websites
   --------------------------------------------------------------------- */
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },

  // Already built, just uncomment to show:
  // { label: "Book Events", href: "/events" },

  // Link to another website:
  // { label: "Instagram", href: "https://instagram.com/yourpage", external: true },
];

/* ---------------------------------------------------------------------
   HOME BANNER TEXT
   --------------------------------------------------------------------- */
export const HERO = {
  eyebrow: "Tactical / Outdoor / Firearms",
  titleLead: "Gear for a",
  titleAccent: "Higher purpose.",
  text: "Quality tactical clothing, outdoor gear and firearms accessories for those who never settle.",
  buttonLabel: "Shop now",
  buttonHref: "/categories",
};

/* ---------------------------------------------------------------------
   "FEATURED PRODUCTS" SECTION ON THE HOME PAGE
   limit = how many random products to show
   --------------------------------------------------------------------- */
export const FEATURED = {
  limit: 8,
  eyebrow: "Picked for you",
  title: "Featured gear",
  subtitle: "A random mix from across the shop. Refresh for a new selection.",
};

/* ---------------------------------------------------------------------
   CONTACT DETAILS + SOCIAL LINKS
   Used by the Contact page, the About page and the footer.
   Leave a value as "" (or delete it) and that icon/card disappears.
   --------------------------------------------------------------------- */
export const CONTACT = {
  email: "tacarms1@gmail.com",
  whatsapp: "27849531361",              
  whatsappDisplay: "084 953 1361",
  instagram: "https://www.instagram.com/tac.arms.1/",
  instagramHandle: "@tac.arms.1",
  facebook: "https://www.facebook.com/TacarmsPage/",
  facebookName: "Tac Arms",
  location: "114 A VAN DEVENTER STREET, RANDGATE, RANDFONTEIN, GAUTENG, 1759",                         // keep whatever you had
};

/* Shown at checkout and on the order confirmation */
export const DELIVERY_NOTE = "We'll contact you to confirm delivery details and any delivery cost.";

/* ---------------------------------------------------------------------
   ABOUT PAGE TEXT
   specialties and affiliations are lists: add, remove or reorder lines.
   --------------------------------------------------------------------- */
export const ABOUT = {
  eyebrow: "Who we are",
  title: "About us",

  intro:
    "Tac Arms is a tactical and outdoor gear shop built for people who take their kit seriously, from first-time field players to seasoned operators. We supply dependable, field-ready gear and back it with honest advice and good service.",

  specialtiesTitle: "What we offer",
  specialties: [
    "Tactical gear and field equipment",
    "Outdoor and bush-ready kit",
    "Gear for CQB and bush-warfare style gameplay",
    "Advice on choosing the right kit for your game, role and budget",
    "Support for the local tactical and airsoft community",
  ],

  closing:
    "Whether you're gearing up for your first skirmish or your hundredth mission, Tac Arms is here to make sure you show up prepared.",

  affiliationsTitle: "Proudly affiliated with",
  affiliations: ["TC Airsoft (Tunnels Conglomerate)"],
  affiliationsText:
    "Through our partnership with TC Airsoft, we stay connected to the community we serve and support fair play, safety and the growth of tactical sports in South Africa.",
};
