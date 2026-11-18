const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const localFrontend = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const configuredHost = configuredUrl ? (() => {
  try { return new URL(configuredUrl).hostname.toLowerCase(); }
  catch { return ''; }
})() : '';
const configuredIsLocal = ['localhost', '127.0.0.1', '[::1]'].includes(configuredHost);
const defaultUrl = localFrontend ? 'http://localhost:4000' : 'https://content-calendar-backend.vercel.app';
const base = (configuredUrl && (!configuredIsLocal || localFrontend) ? configuredUrl : defaultUrl).replace(/\/$/, '');
export const API_BASE = base.endsWith('/api') ? base : base + '/api';

export function token() {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('cf_access') || '';
}

function clearSession() {
  sessionStorage.removeItem('cf_access');
  sessionStorage.removeItem('cf_refresh');
  sessionStorage.removeItem('cf_user');
}

type ApiError = Error & { status?: number };
let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = sessionStorage.getItem('cf_refresh');
      if (!refreshToken) return false;
      try {
        const response = await fetch(API_BASE + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          cache: 'no-store',
        });
        if (!response.ok) return false;
        const data = await response.json();
        sessionStorage.setItem('cf_access', data.accessToken);
        sessionStorage.setItem('cf_refresh', data.refreshToken);
        if (data.user) sessionStorage.setItem('cf_user', JSON.stringify(data.user));
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const endpoint = API_BASE + (path.startsWith('/') ? path : '/' + path);
  const send = () => {
    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const access = token();
    if (access) headers.set('Authorization', 'Bearer ' + access);
    return fetch(endpoint, { ...options, headers, cache: 'no-store' });
  };

  let response: Response;
  try {
    response = await send();
  } catch {
    throw new Error('Could not reach the API. Check the backend URL, deployment status, and CORS settings.');
  }

  if (response.status === 401 && typeof window !== 'undefined' && await refreshSession()) {
    try {
      response = await send();
    } catch {
      throw new Error('Could not reach the API after refreshing the session. Check the backend URL and CORS settings.');
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(
      Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || 'Request failed (' + response.status + ')',
    ) as ApiError;
    error.status = response.status;
    if (response.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (!location.pathname.startsWith('/login') && !location.pathname.startsWith('/register') && !location.pathname.startsWith('/share/')) {
        location.assign('/login');
      }
    }
    throw error;
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

export const fmtDate = (date: string) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
