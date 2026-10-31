// Change this if your Django server runs somewhere else.
export const API_URL = "http://127.0.0.1:8000";

const KEY = "tactical_tokens";

export const getTokens = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};
export const setTokens = (t) => localStorage.setItem(KEY, JSON.stringify(t));
export const clearTokens = () => localStorage.removeItem(KEY);

/* Exchanges the refresh token for a new access token.
   Shared promise so parallel 401s only trigger one refresh. */
let refreshing = null;
function refreshAccess() {
  const t = getTokens();
  if (!t?.refresh) return Promise.resolve(false);

  refreshing ??= fetch(`${API_URL}/api/accounts/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: t.refresh }),
  })
    .then(async (r) => {
      if (!r.ok) throw new Error("refresh failed");
      const d = await r.json();
      setTokens({ ...t, ...d }); // d.access (and d.refresh if rotation is on)
      return true;
    })
    .catch(() => {
      clearTokens();
      return false;
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

/* api("/api/carts/")
   api("/api/accounts/login/", { method: "POST", body: {...}, auth: false }) */
export async function api(path, { method = "GET", body, auth = true } = {}) {
  const send = () => {
    const headers = { "Content-Type": "application/json" };
    const t = getTokens();
    if (auth && t?.access) headers.Authorization = `Bearer ${t.access}`;
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let res = await send();
  if (res.status === 401 && auth && (await refreshAccess())) res = await send();

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* Turns a Django/DRF error into text you can show the user. */
export function errorMessage(err) {
  const d = err?.data;
  if (!d) return "Could not reach the server. Is it running?";
  if (typeof d === "string") return d;
  if (d.detail) return d.detail;
  return Object.entries(d)
    .map(([k, v]) => `${k === "non_field_errors" || k === "error" ? "" : k.replace(/_/g, " ") + ": "}${[].concat(v).join(" ")}`)
    .join("\n");
}

/* ---------- display helpers ---------- */
export const CURRENCY = "ZAR"; 
export const LOCALE = "en-ZA";

export const formatPrice = (n) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(Number(n) || 0);

/* Django returns image paths like "/media/products/x.jpg".
   The browser would look for those on the React server, so prefix the API address. */
export const mediaUrl = (p) =>
  !p ? null : /^(https?:|data:|blob:)/.test(p) ? p : `${API_URL}${p.startsWith("/") ? "" : "/"}${p}`;

/* ---------- orders ---------- */
export const orderRef = (id) => `ORD-${String(id).padStart(5, "0")}`;

export const STATUS_LABEL = {
  pending: "Received",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_LABEL = {
  cod: "Cash on delivery",
  eft: "Bank transfer (EFT)",
  card: "Card / online",
};
