import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as authService from "./authService";

const AuthContext = createContext(null);

export function AuthProvider({ children, initialState = null }) {
  const [bootstrapped, setBootstrapped] = useState(
    () => initialState?.bootstrapped ?? !authService.getToken(),
  );
  const [user, setUser] = useState(() => {
    if (initialState?.user) return initialState.user;
    return authService.userFromStorage();
  });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = authService.getToken();
    if (!token) {
      setUser(null);
      setBootstrapped(true);
      return;
    }

    const cached = authService.userFromStorage();
    if (cached) {
      setUser(cached);
      setBootstrapped(true);
      authService.refreshSessionInBackground(setUser);
      return;
    }

    const fromToken = authService.userFromToken(token);
    if (fromToken) {
      authService.setSession(token, fromToken);
      setUser(fromToken);
      setBootstrapped(true);
      authService.refreshSessionInBackground(setUser);
      return;
    }

    void authService.getMe({ clearOnFailure: false }).then((res) => {
      if (res?.success) {
        setUser(res.user);
      } else {
        const fromToken = authService.userFromToken(token);
        if (fromToken) {
          authService.setSession(token, fromToken);
          setUser(fromToken);
        } else {
          authService.clearSession();
          setUser(null);
        }
      }
      setBootstrapped(true);
    });
  }, []);

  const login = useCallback(async ({ email, password, force = false }) => {
    const res = await authService.login({ email, password, force });
    setUser(res.user);
    setBootstrapped(true);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setBootstrapped(true);
  }, []);

  const refreshSession = useCallback(async () => {
    const cached = authService.userFromStorage();
    if (cached) {
      setUser(cached);
      setBootstrapped(true);
      authService.refreshSessionInBackground(setUser);
      return true;
    }

    const res = await authService.getMe();
    if (res?.success) {
      setUser(res.user);
      setBootstrapped(true);
      return true;
    }
    setUser(null);
    setBootstrapped(true);
    return false;
  }, []);

  const value = useMemo(
    () => ({
      bootstrapped,
      booting: !bootstrapped,
      user,
      isAuthenticated: Boolean(user) && Boolean(authService.getToken()),
      login,
      logout,
      refreshSession,
    }),
    [bootstrapped, user, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
