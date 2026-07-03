import { setSession, userFromToken, userFromJwtLenient } from "../auth/authService";

const TOKEN_KEY = "cpcb_auth_token";
const USER_KEY = "cpcb_current_user";

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

/** Regex fallback when URLSearchParams fails on very long / malformed URLs */
export function extractTokenFromHref() {
  const qs = extractSsoQueryString();
  if (qs) {
    const token = new URLSearchParams(qs).get("token");
    if (token) return normalizeSsoToken(token);
  }

  const match = window.location.href.match(/[?&#]token=([^&#]+)/);
  return match ? normalizeSsoToken(match[1]) : null;
}

export function parseSsoParams() {
  const qs = extractSsoQueryString();
  if (qs) return new URLSearchParams(qs);

  const token = extractTokenFromHref();
  if (token) {
    const p = new URLSearchParams();
    p.set("token", token);
    p.set("climeto_sso", "1");
    return p;
  }

  return null;
}

function cleanSsoFromUrl() {
  const path = window.location.pathname === "/login" ? "/" : "/";
  window.history.replaceState({}, "", path);
}

function persistSsoSession(params) {
  let token = normalizeSsoToken(params.get("token"));
  if (!token) token = extractTokenFromHref();
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
      localStorage.setItem(userKey, currentUser);
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

/** Idempotent — safe to call from getToken / axios before every API request */
export function ensureClimetoSsoSession() {
  const params = parseSsoParams();
  if (!params) return false;
  if (params.get("climeto_sso") !== "1" && !params.get("token")) return false;

  try {
    const ok = persistSsoSession(params);
    if (ok) cleanSsoFromUrl();
    return ok;
  } catch (err) {
    console.warn("[CPCB SSO] failed to apply session:", err);
    return false;
  }
}

/** SSO from climeto-portal — stores token in cpcb_auth_token + cpcb_current_user */
export function applyClimetoSsoFromUrl() {
  return ensureClimetoSsoSession();
}
