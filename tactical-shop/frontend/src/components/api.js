// Change this if your Django server runs somewhere else.
export const API_URL = "http://127.0.0.1:8000";

const KEY = "tactical_tokens";
const TIMEOUT_MS = 15000; // give up on a request after 15 seconds

/* ---------- saved login tokens ---------- */
export const getTokens = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};
export const setTokens = (t) => localStorage.setItem(KEY, JSON.stringify(t));
export const clearTokens = () => localStorage.removeItem(KEY);

/* ---------- low-level fetch with a timeout ----------
   Throws an Error flagged { network: true } or { timeout: true } so the
   screens can show a sensible message. */
const fail = (message, flags) => Object.assign(new Error(message), flags);

async function request(url, options) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e) {
    throw e.name === "AbortError"
      ? fail("timeout", { timeout: true })
      : fail("network", { network: true });
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- token refresh ----------
   Returns "ok" | "expired" (login really is over) | "failed" (network blip,
   keep the tokens and let the user retry). Shared so parallel 401s refresh once. */
let refreshing = null;
function refreshAccess() {
  const t = getTokens();
  if (!t?.refresh) return Promise.resolve("expired");

  refreshing ??= request(`${API_URL}/api/accounts/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: t.refresh }),
  })
    .then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setTokens({ ...t, ...d }); // d.access (and d.refresh if rotation is on)
        return "ok";
      }
      if (r.status === 400 || r.status === 401) {
        clearTokens();
        return "expired";
      }
      return "failed";
    })
    .catch(() => "failed")
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}

/* ---------- the one function every screen uses ----------
   api("/api/carts/")
   api("/api/accounts/login/", { method: "POST", body: {...}, auth: false })
   auth: false      -> don't send the login token (use for public data)
   notifyExpired    -> false = don't pop up the login box if the session ended */
export async function api(path, { method = "GET", body, auth = true, notifyExpired = true } = {}) {
  const hadTokens = Boolean(getTokens());

  const send = () => {
    const headers = { "Content-Type": "application/json" };
    const t = getTokens();
    if (auth && t?.access) headers.Authorization = `Bearer ${t.access}`;
    return request(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let res = await send();

  if (res.status === 401 && auth && hadTokens) {
    const outcome = await refreshAccess();
    if (outcome === "ok") res = await send();
    else if (outcome === "expired" && notifyExpired) {
      window.dispatchEvent(new Event("auth:expired")); // AuthProvider listens for this
    }
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* ---------- turning errors into text ---------- */
const prettyField = (k) => k.replace(/_/g, " ");

export function errorMessage(err) {
  if (err?.network) return "Could not reach the server. Check your connection and try again.";
  if (err?.timeout) return "The server took too long to respond. Please try again.";
  if (err?.status >= 500) return "Something went wrong on our side. Please try again in a moment.";
  if (err?.status === 429) return "Too many attempts. Please wait a moment and try again.";

  const d = err?.data;
  if (!d) {
    if (err?.status === 403) return "You don't have permission to do that.";
    if (err?.status === 404) return "We couldn't find that.";
    return "Something went wrong. Please try again.";
  }
  if (typeof d === "string") return d;
  if (d.detail) return d.detail;
  if (d.error) return d.error;

  return Object.entries(d)
    .map(([k, v]) => `${k === "non_field_errors" ? "" : prettyField(k) + ": "}${[].concat(v).join(" ")}`)
    .join("\n");
}

/* Splits a Django validation error into messages for individual form fields
   plus a general message for everything else.
   const { fields, general } = splitErrors(err, ["email", "password"]) */
export function splitErrors(err, knownFields = []) {
  const d = err?.data;
  const fields = {};
  const general = [];

  if (d && typeof d === "object" && !Array.isArray(d)) {
    for (const [k, v] of Object.entries(d)) {
      const msg = [].concat(v).join(" ");
      if (knownFields.includes(k)) fields[k] = msg;
      else if (["detail", "error", "non_field_errors"].includes(k)) general.push(msg);
      else general.push(`${prettyField(k)}: ${msg}`);
    }
  }
  if (!Object.keys(fields).length && !general.length) general.push(errorMessage(err));

  return { fields, general: general.join(" ") };
}

/* ---------- display helpers ---------- */
export const CURRENCY = "ZAR"; // change to "USD", "EUR"... if needed
export const LOCALE = "en-ZA";

export const formatPrice = (n) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(Number(n) || 0);

/* Django returns image paths like "/media/products/x.jpg".
   The browser would look for those on the React server, so prefix the API address. */
export const mediaUrl = (p) =>
  !p ? null : /^(https?:|data:|blob:)/.test(p) ? p : `${API_URL}${p.startsWith("/") ? "" : "/"}${p}`;

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
