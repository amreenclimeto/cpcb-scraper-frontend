import { setSession } from "../auth/authService";

/** SSO from climeto-portal — stores token in cpcb_auth_token + cpcb_current_user */
export function applyClimetoSsoFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("climeto_sso") !== "1") return false;

  const token = params.get("token");
  const tokenKey = params.get("tokenKey") || "cpcb_auth_token";
  const userKey = params.get("userKey") || "cpcb_current_user";
  const currentUser = params.get("currentUser");

  if (token && currentUser) {
    try {
      const user = JSON.parse(currentUser);
      setSession(token, user);
    } catch {
      localStorage.setItem(tokenKey, token);
      localStorage.setItem(userKey, currentUser);
    }
  } else if (token) {
    localStorage.setItem(tokenKey, token);
  }

  ["climeto_sso", "token", "tokenKey", "userKey", "currentUser"].forEach((k) =>
    params.delete(k),
  );

  const nextPath = window.location.pathname === "/login" ? "/" : window.location.pathname;
  const clean =
    nextPath +
    (params.toString() ? `?${params.toString()}` : "") +
    window.location.hash;
  window.history.replaceState({}, "", clean);
  return Boolean(token);
}
