# Tactical shop: React frontend + Django backend files

```
tactical-shop/
├── README.md
├── frontend/src/      → goes into your React project's  src/
└── backend/           → goes into your Django project  (folder with manage.py)
```

---------------------------------------------------------------------
## 1. FRONTEND  (copy `frontend/src/` over your React project's `src/`)
---------------------------------------------------------------------

| File | Purpose |
|---|---|
| `src/main.jsx` | Entry point. Adds the router. **Replaces** yours. |
| `src/App.jsx` | The list of pages/routes. Add new pages here. **Replaces** yours. |
| `src/index.css` | Global reset. **Replaces** the Vite/CRA default (the default breaks the layout). |
| `src/shop.css` | Styles for product, cart, order and featured sections. |
| `src/siteConfig.js` | **Edit this for everyday changes**: menu links, banner text, featured section text. |
| `src/components/logo.png` | PLACEHOLDER logo. Overwrite with your own logo, keep the name. |
| `src/components/api.js` | Server address (line 2), login tokens, price format, currency. |
| `src/components/AppContext.jsx` | Logged-in user + cart logic shared by all pages. |
| `src/components/Banner.jsx / .css` | Top header, menu and hero banner. |
| `src/components/Categories.jsx / .css` | The orange category carousel (loads from the API). |
| `src/components/FeaturedProducts.jsx` | Random products from different categories. |
| `src/components/ProductCard.jsx` | One product + Add to cart button. |
| `src/components/AuthModal.jsx / .css` | Login / sign up / log out popup. |
| `src/components/Layout.jsx` | Wraps every page with the banner and popup. |
| `src/components/RequireLogin.jsx` | Shows a "Log in" prompt on private pages. |
| `src/pages/HomePage.jsx` | Categories + featured products. |
| `src/pages/CategoriesPage.jsx` | The Categories menu page. |
| `src/pages/CategoryPage.jsx` | Products inside one category. |
| `src/pages/CartPage.jsx` | Cart, quantities, remove, then "Proceed to checkout". |
| `src/pages/CheckoutPage.jsx` | NEW: delivery details, payment method choice, order review. |
| `src/pages/OrderPage.jsx` | "Order received" confirmation, progress tracker, payment instructions. |
| `src/pages/OrdersPage.jsx` | NEW: "My orders" history (linked from the account popup). |
| `src/pages/AboutPage.jsx` | Placeholder About page. |
| `src/pages/EventsPage.jsx` | Placeholder Book Events page. |

Setup:

    cd your-react-project
    npm install react-router-dom
    # copy frontend/src/* into your src/, then:
    npm run dev

You can delete the old `src/App.css` and `src/assets/`.

### Editing the menu (src/siteConfig.js)

    export const NAV_LINKS = [
      { label: "Home", href: "/" },
      { label: "Categories", href: "/categories" },
      // { label: "About", href: "/about" },          <- remove the // to show
      // { label: "Book Events", href: "/events" },   <- remove the // to show
    ];

To add a brand new page:
1. Copy `pages/AboutPage.jsx` to `pages/MyPage.jsx` and edit it.
2. In `App.jsx` add the import and `<Route path="/my-page" element={<MyPage />} />`.
3. In `siteConfig.js` add `{ label: "My Page", href: "/my-page" }`.

---------------------------------------------------------------------
## 2. BACKEND  (copy `backend/` files into your Django project)
---------------------------------------------------------------------

Paths below are relative to the folder that contains `manage.py`.

| File in this zip | Copy to | New or replaces? |
|---|---|---|
| `backend/ecommerce_backend/settings.py` | `ecommerce_backend/settings.py` | Replaces (adds corsheaders, AUTH_USER_MODEL, CORS list) |
| `backend/ecommerce_backend/urls.py` | `ecommerce_backend/urls.py` | Replaces (adds accounts + carts) |
| `backend/accounts/models.py` | `accounts/models.py` | Replaces (custom User) |
| `backend/accounts/admin.py` | `accounts/admin.py` | Replaces |
| `backend/accounts/serializers.py` | `accounts/serializers.py` | NEW |
| `backend/accounts/views.py` | `accounts/views.py` | Replaces |
| `backend/accounts/urls.py` | `accounts/urls.py` | NEW |
| `backend/categories/serializers.py` | `categories/serializers.py` | Replaces (adds image) |
| `backend/categories/views.py` | `categories/views.py` | Replaces |
| `backend/orders/models.py` | `orders/models.py` | Replaces (adds delivery fields + payment methods) |
| `backend/orders/serializers.py` | `orders/serializers.py` | Replaces (adds checkout validation) |
| `backend/orders/views.py` | `orders/views.py` | Replaces (checkout saves delivery + payment) |
| `backend/orders/admin.py` | `orders/admin.py` | Replaces (status editing + bulk actions) |
| `backend/products/views.py` | `products/views.py` | Replaces (adds featured_products) |
| `backend/products/urls.py` | `products/urls.py` | Replaces (adds featured/) |

`carts/` is NOT included: leave it as it is.

NOTE: the included settings.py is your own file plus the lines marked `NEW`.
If you have made other changes to settings.py since, copy only the NEW lines instead.

Setup:

    pip install djangorestframework djangorestframework-simplejwt django-cors-headers pillow

If you are switching to the custom user for the first time, the database must be
reset (the old tables point at Django's default user). Back up first if needed:

    python manage.py dumpdata categories products --indent 2 > backup.json
    rm db.sqlite3
    find . -path "*/migrations/*.py" -not -name "__init__.py" -not -path "*/venv/*" -not -path "*/.venv/*" -delete
    python manage.py makemigrations accounts categories products carts orders
    python manage.py migrate
    python manage.py createsuperuser
    python manage.py loaddata backup.json      # only if you made a backup
    python manage.py runserver

### Orders update (delivery details + payment methods)

After copying the `orders/` files, add the new columns to the database
(existing orders are kept, their new fields are simply blank):

    python manage.py makemigrations orders
    python manage.py migrate

### Payments: what is switched on

Customers can choose: Cash on delivery, or Bank transfer (EFT).
"Card / online" is shown greyed out as "Coming soon" until a gateway is connected.

- Menu of methods, bank details, contact info: `frontend/src/siteConfig.js`
- Methods the SERVER accepts: `ENABLED_PAYMENT_METHODS` in `orders/serializers.py`
  (a method must be enabled in BOTH places).

Before going live, replace the placeholder `BANK_DETAILS` and `STORE_CONTACT`
in `siteConfig.js` with your real details.

---------------------------------------------------------------------
## 3. CHECK IT WORKS
---------------------------------------------------------------------

Open these in the browser while Django is running:

    http://127.0.0.1:8000/api/categories/
    http://127.0.0.1:8000/api/products/featured/?limit=8

Then open the React site (usually http://localhost:5173), sign up from the
account icon, browse a category, add something to the cart, then Cart > Proceed
to checkout > Place order. You should land on the "Order received" page.
Change its status in /admin/ > Orders and refresh to see the tracker move.

Troubleshooting:
- Page error mentioning logo.png: the file must be at src/components/logo.png
- "CORS" error in the browser console: check CORS_ALLOWED_ORIGINS matches your React address
- Cart badge always 0: `api/carts/` missing from the project urls.py
- Images not loading: product images need MEDIA_URL/MEDIA_ROOT and the DEBUG static() line in urls.py
- Server address differs from http://127.0.0.1:8000: change line 2 of src/components/api.js
