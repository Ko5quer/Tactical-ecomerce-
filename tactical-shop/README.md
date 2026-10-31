# TC Airsoft Guild shop: React frontend + Django backend

```
tactical-shop/
├── README.md
├── frontend/src/      -> goes into your React project's  src/
└── backend/           -> goes into your Django project  (folder with manage.py)
```

---------------------------------------------------------------------
## 1. FRONTEND  (copy `frontend/src/` over your React project's `src/`)
---------------------------------------------------------------------

    cd your-react-project
    npm install react-router-dom
    # copy frontend/src/* into your src/
    npm run dev

You can delete the old `src/App.css` and `src/assets/`.
Replace `src/components/logo.png` (a placeholder) with your own logo, same name.

### Files

| File | Purpose |
|---|---|
| `src/main.jsx` | Entry point (adds the router). Replaces yours. |
| `src/App.jsx` | List of pages/routes. Replaces yours. |
| `src/index.css` | Global reset. Replaces the Vite/CRA default (the default breaks the layout). |
| `src/shop.css` | Styles for products, cart, checkout, orders, search, about, contact, footer. |
| **`src/siteConfig.js`** | **Edit this for everyday changes**: menu, banner text, About text, contact + social links. |
| `components/api.js` | Server address (line 2), login tokens, error messages, price format/currency. |
| `components/validation.js` | Form checks (name, email, phone, address...) + the `useForm` helper. |
| `components/Field.jsx` | One form field with its error message. |
| `components/AppContext.jsx` | Logged-in user + cart, shared by all pages. |
| `components/Banner.jsx / .css` | Header, menu, hero banner. |
| `components/Categories.jsx / .css` | Orange category carousel. |
| `components/FeaturedProducts.jsx` | Random products from different categories. |
| `components/ProductCard.jsx` | One product + Add to cart. |
| `components/AuthModal.jsx / .css` | Log in / sign up / log out popup. |
| `components/SearchOverlay.jsx` | Search box opened by the magnifying glass. |
| `components/SocialLinks.jsx` | SVG icons (email, WhatsApp, Instagram, Facebook) + link list. |
| `components/Footer.jsx` | Footer with menu links and social icons. |
| `components/Layout.jsx` | Banner + footer + popups around every page. |
| `components/ErrorBoundary.jsx` | Friendly message instead of a blank page if a page crashes. |
| `components/ErrorNotice.jsx` | Visible error with a "Try again" button. |
| `components/SafeImage.jsx` | Image that shows "No image" when missing/broken. |
| `components/RequireLogin.jsx` | "Log in" prompt on private pages. |
| `pages/HomePage.jsx` | Categories + featured products. |
| `pages/CategoriesPage.jsx` | The Categories menu page. |
| `pages/CategoryPage.jsx` | Products in one category. |
| `pages/SearchPage.jsx` | Search results (`/search?q=...`). |
| `pages/CartPage.jsx` | Cart, quantities, remove. |
| `pages/CheckoutPage.jsx` | Delivery details + payment method (options come from the server). |
| `pages/OrderPage.jsx` | "Order received", progress tracker, how to pay (bank details from the server). |
| `pages/OrdersPage.jsx` | My orders list. |
| `pages/AboutPage.jsx` | About us (text from `ABOUT` in siteConfig.js). |
| `pages/ContactPage.jsx` | Contact cards + message form (details from `CONTACT` in siteConfig.js). |
| `pages/EventsPage.jsx` | Placeholder "Book events" page (not in the menu yet). |

### Everyday edits (src/siteConfig.js)

- Menu: edit `NAV_LINKS` (Home, Categories, About and Contact are on by default).
- To add a page: create it in `pages/`, add a `<Route>` in `App.jsx`, add a line to `NAV_LINKS`.
- About text: edit `ABOUT` (specialties and affiliations are lists).
- Email / WhatsApp / Instagram / Facebook: edit `CONTACT`. Clear a value and its icon disappears.

---------------------------------------------------------------------
## 2. BACKEND  (copy `backend/` files into your Django project)
---------------------------------------------------------------------

Paths are relative to the folder that contains `manage.py`.

| File in this zip | Copy to | |
|---|---|---|
| `ecommerce_backend/settings.py` | same path | replaces (corsheaders, AUTH_USER_MODEL, CORS list) |
| `ecommerce_backend/urls.py` | same path | replaces (adds accounts + carts) |
| `accounts/models.py`, `admin.py`, `views.py` | same paths | replace |
| `accounts/serializers.py` | same path | replaces (name checks) |
| `accounts/urls.py` | same path | new |
| `categories/serializers.py`, `views.py` | same paths | replace |
| `products/views.py`, `urls.py` | same paths | replace (featured + search) |
| `carts/views.py` | same path | replaces (stock + input checks) |
| `orders/models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py` | same paths | replace |

The included `settings.py` is your file plus the lines marked `NEW`. If you changed
settings since, copy only the NEW lines instead.

Setup:

    pip install djangorestframework djangorestframework-simplejwt django-cors-headers pillow
    python manage.py makemigrations orders
    python manage.py migrate
    python manage.py runserver

(If you are moving to the custom user for the first time, the database must be reset:
see the notes in the chat history, or back up with `dumpdata` first.)

### New API addresses

    GET  /api/products/featured/?limit=8       random in-stock products, mixed categories
    GET  /api/products/search/?q=cargo         products + categories matching the words typed
    GET  /api/orders/payment-methods/          public: options shown at checkout
    GET  /api/orders/<id>/payment-instructions/  private: how to pay for YOUR order (bank details for EFT)

---------------------------------------------------------------------
## 3. BANK DETAILS AND PAYMENT SETTINGS  (edited in /admin/, not in code)
---------------------------------------------------------------------

Log in to `/admin/` and open the **Orders** section:

### Bank accounts  (shown to customers who choose EFT)
Add ONE account and leave "Is active" ticked. Fields:

| Field | Notes |
|---|---|
| Bank name | e.g. FNB, Standard Bank |
| Account holder | exactly as the bank has it |
| Account number | |
| Branch code | |
| Branch name | optional |
| Account type | business / cheque / savings / transmission |
| SWIFT code | only if you accept international payments |
| Proof of payment email | where customers send proof of payment |

If you add a second account and tick "Is active", the first one switches off automatically.
Customers only see the bank details on THEIR OWN unpaid EFT order, never publicly.
The payment reference is the order number (`ORD-00012`), shown with a Copy button.

### Payment methods  (what shows at checkout)
Cash on delivery, Bank transfer (EFT) and Card/online are created automatically the
first time they are needed. In `/admin/` > Payment methods you can:
- turn a method on/off (`Is enabled`; off = shown greyed out as "Coming soon")
- change its label, short description and the instructions shown after ordering
- change the order they appear in

### Payment gateways  (for card payments later)
Stores NON-SECRET settings only: provider, sandbox/live mode, merchant ID, notes.
Secret keys (merchant key, passphrase, secret key) must go in environment variables,
never in the database or the React code. Card payments stay "Coming soon" until a
gateway integration is written.

---------------------------------------------------------------------
## 4. CHECK IT WORKS
---------------------------------------------------------------------

With Django running, open:

    http://127.0.0.1:8000/api/categories/
    http://127.0.0.1:8000/api/products/featured/?limit=8
    http://127.0.0.1:8000/api/products/search/?q=pants
    http://127.0.0.1:8000/api/orders/payment-methods/

Then use the site: sign up, search, add to cart, checkout with EFT, and check the order
page shows your bank details. Change the order's status in /admin/ and refresh.

Troubleshooting:
- Page error mentioning logo.png: the file must be at src/components/logo.png
- "CORS" error in the console: CORS_ALLOWED_ORIGINS must match your React address and port
- Cart badge always 0: `api/carts/` missing from the project urls.py
- "Bank details aren't available online yet": add a Bank account in /admin/ and tick Is active
- Payment options won't load: check /api/orders/payment-methods/ opens in the browser
- Images not loading: MEDIA_URL/MEDIA_ROOT and the DEBUG static() line in urls.py
- Server address differs from http://127.0.0.1:8000: change line 2 of src/components/api.js
