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
  if (import.meta.env.DEV) {
    const override = import.meta.env.VITE_AUTH_API_BASE_URL;
    if (override) return String(override).replace(/\/$/, "");
    return "/climeto-api";
  }
  const base =
    import.meta.env.VITE_AUTH_API_BASE_URL ||
    import.meta.env.VITE_CLIMETO_API_BASE_URL ||
    "https://api.climeto.in/api";
  return String(base).replace(/\/$/, "");
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

/** Sync read after SSO — call from main.jsx before React mounts */
export function hydrateAuthFromStorage() {
  const token = getToken();
  const user = userFromStorage();
  return { token, user, isAuthenticated: Boolean(token && user) };
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

export async function getMe() {
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
      clearSession();
      return {
        success: false,
        error: "Unauthorized: AUDIT_CERTIFICATES access required.",
        status: 403,
      };
    }

    setSession(token, user);
    return { success: true, user };
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
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

/** Background refresh — does not block UI */
export function refreshSessionInBackground(onUser) {
  void getMe().then((res) => {
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
