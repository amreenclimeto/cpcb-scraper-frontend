import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const submit = async (force = false) => {
    setError("");
    const e = email.trim();
    if (!e) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setBusy(true);
    try {
      await login({ email: e, password, force });
      navigate("/", { replace: true });
    } catch (err) {
      const data = err?.data;
      if (data?.requiresConfirmation || data?.code === "SESSION_CONFIRMATION_REQUIRED") {
        setRequiresConfirmation(true);
        setError(
          data?.msg ||
            "This account is active on another device. Use Force Login to continue here.",
        );
        return;
      }
      setError(err?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
            C
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">CPCB Scraper</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in with your <span className="font-mono text-xs">AUDIT_CERTIFICATES</span> Climeto account
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Or open from the{" "}
            <a href={import.meta.env.VITE_PORTAL_URL || "http://localhost:3100"} className="text-emerald-600 hover:underline">
              Climeto Portal
            </a>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@company.com"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {requiresConfirmation ? (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="flex gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Only users with type AUDIT_CERTIFICATES can access this portal.</span>
            </div>
          )}

          {error && !requiresConfirmation ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => submit(false)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {busy ? "Signing in..." : "Login"}
            </button>
            <button
              type="button"
              disabled={busy || !requiresConfirmation}
              onClick={() => submit(true)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              title="Replace session on another device"
            >
              Force Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
