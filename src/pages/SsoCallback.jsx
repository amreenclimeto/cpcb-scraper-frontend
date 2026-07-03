import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { applyClimetoSsoFromUrl } from "../utils/climetoSso";

/** Portal redirect target — /sso?token=...&tokenKey=... */
export default function SsoCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    applyClimetoSsoFromUrl();
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        <p className="text-sm text-gray-500">Signing you in...</p>
      </div>
    </div>
  );
}
