/* =====================================================================
   SITE CONFIG: the one file to edit for everyday changes.
   Menu links, banner text, About text, contact details and social links
   all live here.

   (Payment details such as bank account info are NOT here: they are
   stored on the server and edited in the Django admin. See README.)
   ===================================================================== */

export const SITE = {
  name: "TC Airsoft Guild",
  tagline: "Gear for a higher purpose.",
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
  email: "tcairsoftguild@gmail.com",

  whatsapp:
    "https://api.whatsapp.com/send/?phone=%2B27656834435&text&type=phone_number&app_absent=0",
  whatsappDisplay: "+27 65 683 4435",

  instagram: "https://www.instagram.com/tunnels_conglomerate/",
  instagramHandle: "@tunnels_conglomerate",

  facebook: "https://www.facebook.com/groups/1069467703823369/",
  facebookLabel: "Join our Facebook group",

  location: "Pretoria, Gauteng",
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
    "TC Airsoft Guild (Tunnels Conglomerate) is a tactical airsoft community based in Pretoria, Gauteng, founded by a few great friends and built for everyone from fresh recruits to veteran operators. We believe in honor, adrenaline, and community.",

  specialtiesTitle: "We specialize in",
  specialties: [
    "CQB (Close Quarters Battle) scenarios",
    "Bush warfare missions",
    "Tactical simulations with evolving objectives",
    "Our own hybrid format: Bonksoft (Melee + Airsoft madness) in partnership with the Dahoga Emporium",
    "Laying the groundwork for Airsoft x Real Steel crossover training",
  ],

  closing:
    "Whether you're looking for a casual skirmish, an intense mission, or a creative game mode, TC is the place to test your tactics and make lifelong friends.",

  affiliationsTitle: "Proudly affiliated with",
  affiliations: ["SAACA (South African Airsoft Club Association)", "Bear Projects"],
  affiliationsText: "We support fair play, safety, and the growth of airsoft in South Africa.",
};
