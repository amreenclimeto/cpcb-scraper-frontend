import { setSession, userFromToken, userFromJwtLenient } from "../auth/authService";

const TOKEN_KEY = "cpcb_auth_token";
const USER_KEY = "cpcb_current_user";

const JWT_IN_URL =
  /[?&#]token=(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/;

/** JWT in query strings: '+' often becomes space — repair before verify/storage */
export function normalizeSsoToken(raw) {
  if (!raw) return null;
  let token = String(raw).trim();
  try {
    token = decodeURIComponent(token);
  } catch {
    /* use as-is */
  }
  if (token.includes(" ") && token.includes(".")) {
    const parts = token.split(".");
    if (parts.length === 3) {
      token = parts.map((p) => p.replace(/ /g, "+")).join(".");
    }
  }
  return token;
}

/** Extract query string from ?search, #hash, or #/path?query */
export function extractSsoQueryString() {
  const search = window.location.search?.replace(/^\?/, "").trim();
  if (search && (search.includes("token=") || search.includes("climeto_sso=1"))) {
    return search;
  }

  const hash = window.location.hash?.replace(/^#/, "").trim();
  if (!hash) return "";

  const qInHash = hash.indexOf("?");
  if (qInHash !== -1) {
    return hash.slice(qInHash + 1);
  }

  if (hash.includes("token=") || hash.includes("climeto_sso=1") || hash.includes("&")) {
    return hash;
  }

  return "";
}

/** Most reliable — match JWT shape in full href (ignores broken & in currentUser JSON) */
export function extractTokenFromHref() {
  const href = window.location.href;
  const jwtMatch = href.match(JWT_IN_URL);
  if (jwtMatch?.[1]) return normalizeSsoToken(jwtMatch[1]);

  const qs = extractSsoQueryString();
  if (qs) {
    const token = new URLSearchParams(qs).get("token");
    if (token) return normalizeSsoToken(token);
  }

  return null;
}

export function parseSsoParams() {
  const token = extractTokenFromHref();
  if (!token) return null;

  const p = new URLSearchParams(extractSsoQueryString() || "");
  p.set("token", token);
  if (!p.get("climeto_sso")) p.set("climeto_sso", "1");
  return p;
}

export function cleanSsoFromUrl() {
  const path =
    window.location.pathname === "/login" || window.location.pathname === "/sso"
      ? "/"
      : window.location.pathname || "/";
  window.history.replaceState({}, "", path);
}

function persistSsoSession(params) {
  const token = extractTokenFromHref() || normalizeSsoToken(params.get("token"));
  if (!token) return false;

  const tokenKey = params.get("tokenKey") || TOKEN_KEY;
  const userKey = params.get("userKey") || USER_KEY;
  const currentUser = params.get("currentUser");

  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      setSession(token, user);
    } catch {
      localStorage.setItem(tokenKey, token);
      try {
        localStorage.setItem(userKey, currentUser);
      } catch {
        /* quota */
      }
    }
  } else {
    const fromJwt = userFromToken(token) || userFromJwtLenient(token);
    if (fromJwt) {
      setSession(token, fromJwt);
    } else {
      localStorage.setItem(tokenKey, token);
    }
  }

  return true;
}

/** Idempotent — safe before every API request */
export function ensureClimetoSsoSession() {
  const href = window.location.href;
  const hasSso =
    href.includes("climeto_sso=1") ||
    href.includes("token=eyJ") ||
    href.includes("/sso?");

  if (!hasSso && !extractTokenFromHref()) return false;

  const params = parseSsoParams();
  if (!params?.get("token")) return false;

  try {
    const ok = persistSsoSession(params);
    if (ok && hasSso) cleanSsoFromUrl();
    return ok;
  } catch (err) {
    console.warn("[CPCB SSO] failed to apply session:", err);
    return false;
  }
}

/** Token for API calls — URL fallback if localStorage empty */
export function getBearerToken() {
  ensureClimetoSsoSession();
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) return stored;
  } catch {
    /* private mode */
  }
  const fromUrl = extractTokenFromHref();
  if (fromUrl) {
    try {
      localStorage.setItem(TOKEN_KEY, fromUrl);
      const fromJwt = userFromToken(fromUrl) || userFromJwtLenient(fromUrl);
      if (fromJwt) setSession(fromUrl, fromJwt);
    } catch {
      /* ignore */
    }
    return fromUrl;
  }
  return null;
}

/** SSO from climeto-portal */
export function applyClimetoSsoFromUrl() {
  return ensureClimetoSsoSession();
}
