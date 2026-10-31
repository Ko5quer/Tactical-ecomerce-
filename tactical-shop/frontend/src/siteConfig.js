/* =====================================================================
   SITE CONFIG — the one file to edit for everyday changes.
   Nav links, hero text and section headings all live here.
   ===================================================================== */

export const SITE = {
  name: "Airsoft Guild", // used for the logo's alt text
};

/* ---------------------------------------------------------------------
   TOP MENU
   Each entry becomes a link in the banner (and in the mobile menu).
   Order here = order on screen.

   To add a page:
     1. create the page file in src/pages/        (e.g. AboutPage.jsx)
     2. add a <Route> for it in src/App.jsx
     3. add / uncomment a line below

   Fields:
     label     text shown in the menu
     href      where it goes ("/about", or a full https:// link)
     external  (optional) true = open in a new tab, for other websites
   --------------------------------------------------------------------- */
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },

  // Pages already built and routed — just uncomment to show them:
  // { label: "About", href: "/about" },
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
   CHECKOUT: PAYMENT METHODS
   These appear as choices on the checkout page, in this order.
   enabled: false shows the option greyed out with "Coming soon".
   IMPORTANT: a method must also be allowed on the server
   (ENABLED_PAYMENT_METHODS in orders/serializers.py) or checkout will refuse it.
   --------------------------------------------------------------------- */
export const PAYMENT_METHODS = [
  {
    id: "cod",
    label: "Cash on delivery",
    description: "Pay in cash when your order arrives.",
    enabled: true,
  },
  {
    id: "eft",
    label: "Bank transfer (EFT)",
    description: "Pay by EFT. We'll show our bank details after you order and process it once payment reflects.",
    enabled: true,
  },
  {
    id: "card",
    label: "Card / online payment",
    description: "Pay securely online with your card.",
    enabled: false, // switch on once a payment gateway is connected
  },
];

/* Shown on the order page when a customer picks bank transfer (EFT).
   REPLACE with your real banking details. */
export const BANK_DETAILS = {
  "Bank": "Your Bank",
  "Account name": "Your Business Name",
  "Account number": "0000000000",
  "Branch code": "000000",
  "Account type": "Business cheque",
};

/* Shown at checkout and on the order confirmation */
export const DELIVERY_NOTE = "We'll contact you to confirm delivery details and any delivery cost.";

export const STORE_CONTACT = {
  email: "orders@yourshop.com",
  phone: "000 000 0000",
};
