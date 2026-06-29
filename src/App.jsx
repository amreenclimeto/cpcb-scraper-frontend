import "./App.css";
import { AuthProvider } from "./auth/AuthContext";
import AppRoutes from "./routes/AppRoutes";

export default function App({ initialAuth = null }) {
  const initialState = initialAuth
    ? {
        user: initialAuth.user,
        bootstrapped: initialAuth.isAuthenticated,
      }
    : null;

  return (
    <AuthProvider initialState={initialState}>
      <AppRoutes />
    </AuthProvider>
  );
}
