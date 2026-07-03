const TOKEN_KEY = "cpcb_auth_token";
const USER_KEY = "cpcb_current_user";
export const CLIENT_ID = "cpcb-scraper";
const REQUIRED_USER_TYPE_NORM = "auditcertificates";

export function normalizeUserType(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .trim();
}

export function isAuditCertificatesUser(user) {
  return normalizeUserType(user?.user_type) === REQUIRED_USER_TYPE_NORM;
}

function authApiRoot() {
  const override = import.meta.env.VITE_AUTH_API_BASE_URL;
  if (override) return String(override).replace(/\/$/, "");

  // Same-origin proxy on Vercel (vercel.json → api.climeto.in) — avoids CORS + session races
  if (import.meta.env.PROD) {
    return "/climeto-api";
  }

  return "/climeto-api";
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      company_name: user.company_name,
    }),
  );
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function userFromStorage() {
  const stored = getStoredUser();
  if (stored && isAuditCertificatesUser(stored)) return stored;
  return null;
}

function decodeJwtPayload(token) {
  try {
    const part = String(token).split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function userFromJwtPayload(payload) {
  if (!payload?.email || !payload?.user_type) return null;
  return {
    id: payload.id,
    email: payload.email,
    user_type: payload.user_type,
    company_name: payload.company_name,
  };
}

/** Build session user from climeto JWT when portal omits currentUser */
export function userFromToken(token) {
  const user = userFromJwtPayload(decodeJwtPayload(token));
  return user && isAuditCertificatesUser(user) ? user : null;
}

/** JWT user without role gate — used to keep portal SSO session when /auth/me is slow */
export function userFromJwtLenient(token) {
  return userFromJwtPayload(decodeJwtPayload(token));
}

/** Sync read after SSO — call from main.jsx before React mounts */
export function hydrateAuthFromStorage() {
  const token = getToken();
  let user = userFromStorage();

  if (token && !user) {
    const fromToken = userFromToken(token) || userFromJwtLenient(token);
    if (fromToken) {
      setSession(token, fromToken);
      user = isAuditCertificatesUser(fromToken) ? fromToken : userFromStorage();
    }
  }

  const ready = Boolean(token && user && isAuditCertificatesUser(user));

  return {
    token,
    user: ready ? user : null,
    isAuthenticated: ready,
    // Block data APIs until AuthContext finishes validating token (portal SSO race fix)
    bootstrapped: !token || ready,
  };
}

async function parseResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { msg: text };
  }
  if (!res.ok) {
    const err = new Error(data?.msg || data?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Request timed out")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function login({ email, password, force = false }) {
  const res = await fetch(`${authApiRoot()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Climeto-Client": CLIENT_ID,
    },
    body: JSON.stringify({
      email: String(email || "").trim(),
      password,
      force: Boolean(force),
      client: CLIENT_ID,
    }),
  });

  const data = await parseResponse(res);
  const token = data?.token;
  const user = data?.user;

  if (!token || !user) {
    throw new Error("Login succeeded but token or user was missing.");
  }

  if (!isAuditCertificatesUser(user)) {
    clearSession();
    const err = new Error("Unauthorized: AUDIT_CERTIFICATES access required.");
    err.status = 403;
    err.data = { code: "AUDIT_CERTIFICATES_REQUIRED" };
    throw err;
  }

  setSession(token, user);
  return { success: true, token, user, msg: data?.msg };
}

export async function getMe({ clearOnFailure = true } = {}) {
  const token = getToken();
  if (!token) return { success: false, error: "Not logged in." };

  try {
    const res = await withTimeout(
      fetch(`${authApiRoot()}/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Climeto-Client": CLIENT_ID,
        },
      }),
      8000,
    );
    const data = await parseResponse(res);
    const user = data?.user || data;

    if (!isAuditCertificatesUser(user)) {
      if (clearOnFailure) clearSession();
      return {
        success: false,
        error: "Unauthorized: AUDIT_CERTIFICATES access required.",
        status: 403,
      };
    }

    setSession(token, user);
    return { success: true, user };
  } catch (err) {
    if (clearOnFailure && (err.status === 401 || err.status === 403)) {
      clearSession();
    }
    return {
      success: false,
      error: err.message || "Session expired.",
      status: err.status,
      data: err.data,
    };
  }
}

/** Background refresh — never clears session on failure (SSO / portal flow) */
export function refreshSessionInBackground(onUser) {
  void getMe({ clearOnFailure: false }).then((res) => {
    if (res?.success && res.user) onUser(res.user);
  });
}

export async function logout() {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${authApiRoot()}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Climeto-Client": CLIENT_ID,
        },
      });
    } catch {
      /* still clear local session */
    }
  }
  clearSession();
  return { success: true };
}
