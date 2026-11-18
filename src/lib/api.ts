const base = (process.env.NEXT_PUBLIC_API_URL || 'https://content-calendar-backend.vercel.app').replace(/\/$/, '');
const API = base.endsWith('/api') ? base : `${base}/api`;

export function token() {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('cf_access') || '';
}

type ApiError = Error & { status?: number };
let refreshing: Promise<boolean> | null = null;

async function refreshSession() {
  if (!refreshing) refreshing = (async () => {
    const refreshToken = sessionStorage.getItem('cf_refresh');
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${API}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      if (!response.ok) return false;
      const data = await response.json();
      sessionStorage.setItem('cf_access', data.accessToken);
      sessionStorage.setItem('cf_refresh', data.refreshToken);
      if (data.user) sessionStorage.setItem('cf_user', JSON.stringify(data.user));
      return true;
    } catch { return false; }
    finally { refreshing = null; }
  })();
  return refreshing;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const send = () => {
    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const access = token();
    if (access) headers.set('Authorization', `Bearer ${access}`);
    return fetch(`${API}${path.startsWith('/') ? path : `/${path}`}`, { ...options, headers, cache: 'no-store' });
  };
  let response = await send();
  if (response.status === 401 && typeof window !== 'undefined' && await refreshSession()) response = await send();
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || `Request failed (${response.status})`) as ApiError;
    error.status = response.status;
    if (response.status === 401 && typeof window !== 'undefined') {
      sessionStorage.removeItem('cf_access'); sessionStorage.removeItem('cf_refresh'); sessionStorage.removeItem('cf_user');
      if (!location.pathname.startsWith('/login') && !location.pathname.startsWith('/share/')) location.assign('/login');
    }
    throw error;
  }
  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}

export const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
