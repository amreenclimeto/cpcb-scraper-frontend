import axios from "axios";
import { CLIENT_ID, clearSession, getToken } from "../auth/authService";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = apiBaseUrl ? apiBaseUrl : "/api";

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers = config.headers || {};
  config.headers["X-Climeto-Client"] = CLIENT_ID;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      const url = String(error?.config?.url || "");
      const isAuthRoute =
        url.includes("/auth/login") || url.includes("/auth/me");
      if (!isAuthRoute) {
        clearSession();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
