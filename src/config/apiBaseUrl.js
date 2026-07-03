import { getToken, CLIENT_ID } from '../auth/authService';
import { getBearerToken } from '../utils/climetoSso';

const CORRECT_DIRECT_API = 'https://api.climetoserver.cloud/api';

/**
 * Data API base URL for CPCB scraper routes (/pibo, /pwp, /epr-cer).
 *
 * Production (Vercel): always `/api` — vercel.json rewrites to api.climetoserver.cloud
 * (avoids CORS + wrong env typos like api.climeto-server.cloud).
 *
 * Set VITE_API_USE_DIRECT=true only if you intentionally bypass the Vercel proxy.
 */
export function getDataApiBaseUrl() {
  const env = String(import.meta.env.VITE_API_BASE_URL || '').trim();
  const useDirect = import.meta.env.VITE_API_USE_DIRECT === 'true';

  if (import.meta.env.PROD && !useDirect) {
    return '/api';
  }

  if (!env) {
    return '/api';
  }

  if (env.startsWith('/')) {
    return env.replace(/\/$/, '') || '/api';
  }

  const normalized = env.replace(/\/$/, '');

  if (
    normalized.includes('climeto-server.cloud') ||
    normalized.includes('climeto.server.cloud') ||
    (normalized.includes('climetoserver') && normalized !== CORRECT_DIRECT_API)
  ) {
    console.warn(
      '[CPCB API] Invalid VITE_API_BASE_URL; use /api on Vercel or',
      CORRECT_DIRECT_API,
    );
    return import.meta.env.PROD ? '/api' : '/api';
  }

  return normalized;
}

export function getAuthenticatedHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Climeto-Client': CLIENT_ID,
    ...extra,
  };
  const token = getBearerToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function dataApiUrl(path) {
  const base = getDataApiBaseUrl().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
