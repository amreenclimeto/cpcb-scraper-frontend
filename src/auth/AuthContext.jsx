import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authService from "./authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);

  const refreshSession = useCallback(async () => {
    const res = await authService.getMe();
    if (res?.success) {
      setUser(res.user);
      return true;
    }
    setUser(null);
    return false;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = authService.getStoredUser();
        if (stored && authService.getToken()) {
          const ok = await refreshSession();
          if (!ok) authService.clearSession();
        }
      } finally {
        setBooting(false);
      }
    })();
  }, [refreshSession]);

  const login = useCallback(async ({ email, password, force = false }) => {
    const res = await authService.login({ email, password, force });
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      booting,
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshSession,
    }),
    [booting, user, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
