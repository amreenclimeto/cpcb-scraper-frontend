import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { applyClimetoSsoFromUrl } from "./utils/climetoSso.js";
import { hydrateAuthFromStorage } from "./auth/authService.js";
import App from "./App.jsx";

// SSO + storage hydrate before React mounts (same pattern as HR Payroll)
applyClimetoSsoFromUrl();
const initialAuth = hydrateAuthFromStorage();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App initialAuth={initialAuth} />
  </StrictMode>,
);
