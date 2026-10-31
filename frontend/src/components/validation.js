import { useState } from "react";

/* ---------------------------------------------------------------------
   Field checks. Each rule takes the typed value and returns an error
   message, or "" when the value is fine.
   (The server checks the same things again, so nothing relies on this alone.)
   --------------------------------------------------------------------- */
const NAME_RE = /^\p{L}[\p{L}\p{M} '.\-]*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()\-]+$/;
const POSTAL_RE = /^[A-Za-z0-9 \-]{3,10}$/;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;

const clean = (v) => (v ?? "").trim();

export const rules = {
  name:
    (label, { required = true, min = 2, max = 150 } = {}) =>
    (value) => {
      const v = clean(value);
      if (!v) return required ? `${label} is required.` : "";
      if (v.length < min) return `${label} is too short.`;
      if (v.length > max) return `${label} is too long (max ${max} characters).`;
      if (!NAME_RE.test(v))
        return `${label} can only contain letters, spaces, apostrophes, full stops and hyphens.`;
      return "";
    },

  email: (value) => {
    const v = clean(value);
    if (!v) return "Email is required.";
    if (v.length > 254) return "That email address is too long.";
    if (!EMAIL_RE.test(v)) return "Enter a valid email address, like name@example.com.";
    return "";
  },

  newPassword: (value) => {
    const v = value ?? "";
    if (!v) return "Password is required.";
    if (v.length < 8) return "Use at least 8 characters.";
    if (v.length > 128) return "Password is too long (max 128 characters).";
    if (/^\d+$/.test(v)) return "Password can't be only numbers.";
    return "";
  },

  phone: (value) => {
    const v = clean(value);
    if (!v) return "Phone number is required.";
    const digits = v.replace(/\D/g, "");
    if (!PHONE_RE.test(v) || digits.length < 9 || digits.length > 15)
      return "Enter a valid phone number (9 to 15 digits), for example 082 123 4567.";
    return "";
  },

  address: (value) => {
    const v = clean(value);
    if (!v) return "Street address is required.";
    if (v.length < 5) return "Enter your full street address.";
    if (v.length > 255) return "That address is too long (max 255 characters).";
    if (!/\p{L}/u.test(v)) return "The address must contain a street or place name.";
    if (CONTROL_RE.test(v)) return "The address contains invalid characters.";
    return "";
  },

  postal: (value) => {
    const v = clean(value);
    if (!v) return ""; // optional
    if (!POSTAL_RE.test(v)) return "Enter a valid postal code (3 to 10 letters or numbers).";
    return "";
  },

  text:
    (label, { required = false, min = 0, max = 500 } = {}) =>
    (value) => {
      const v = clean(value);
      if (!v) return required ? `${label} is required.` : "";
      if (v.length < min) return `${label} must be at least ${min} characters.`;
      if (v.length > max) return `${label} is too long (max ${max} characters).`;
      if (CONTROL_RE.test(v)) return `${label} contains invalid characters.`;
      return "";
    },
};

/* ---------- ready-made sets of rules for each form ---------- */
export const LOGIN_SCHEMA = {
  email: rules.email,
  password: (v) => (v ? "" : "Password is required."),
};

export const REGISTER_SCHEMA = {
  first_name: rules.name("First name", { max: 150 }),
  last_name: rules.name("Last name", { required: false, max: 150 }),
  email: rules.email,
  password: rules.newPassword,
};

export const CHECKOUT_SCHEMA = {
  full_name: rules.name("Full name"),
  phone: rules.phone,
  address: rules.address,
  city: rules.name("City or town", { max: 100 }),
  postal_code: rules.postal,
  notes: rules.text("Notes", { max: 500 }),
};

export const CONTACT_SCHEMA = {
  name: rules.name("Your name"),
  email: rules.email,
  message: rules.text("Message", { required: true, min: 10, max: 1000 }),
};

/* ---------------------------------------------------------------------
   useForm: keeps the values and error messages for one form.
   const form = useForm({ email: "" }, LOGIN_SCHEMA, "login");
   <Field name="email" idPrefix="login" value={form.values.email}
          onChange={form.setField("email")} onBlur={form.blur("email")}
          error={form.errors.email} />
   --------------------------------------------------------------------- */
export function useForm(initial, schema, idPrefix = "f") {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const check = (name, value, all) => schema[name]?.(value ?? "", all) ?? "";

  const focusFirst = (errs) => {
    const first = Object.keys(errs)[0];
    if (first) document.getElementById(`${idPrefix}-${first}`)?.focus();
  };

  // typing: update the value, and re-check only if the field was already flagged
  const setField = (name) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: check(name, value, { ...values, [name]: value }) }));
  };

  // leaving a field: show its error straight away
  const blur = (name) => () => setErrors((er) => ({ ...er, [name]: check(name, values[name], values) }));

  // submit: check everything, focus the first problem
  const validateAll = () => {
    const next = {};
    for (const name of Object.keys(schema)) {
      const msg = check(name, values[name], values);
      if (msg) next[name] = msg;
    }
    setErrors(next);
    focusFirst(next);
    return Object.keys(next).length === 0;
  };

  // errors that came back from the server, keyed by field name
  const setServerErrors = (fields) => {
    setErrors((er) => ({ ...er, ...fields }));
    focusFirst(fields);
  };

  const reset = (next = initial) => {
    setValues(next);
    setErrors({});
  };

  return { values, errors, setField, blur, validateAll, setServerErrors, reset, idPrefix };
}
