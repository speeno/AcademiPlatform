import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { API_BASE } from '@/lib/api-base';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
export const AUTH_CHANGED_EVENT = 'academiq:auth-changed';

let refreshInFlight: Promise<string | null> | null = null;

function notifyAuthChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

/** 로그인/로그아웃 등 토큰 변경 시 UI 동기화용 구독 */
export function subscribeAuthState(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onAuthChanged = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY || event.key === REFRESH_KEY) listener();
  };

  window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.removeEventListener('storage', onStorage);
  };
}

function authCookieSuffix(): string {
  if (typeof window === 'undefined') return '';
  return window.location.protocol === 'https:' ? '; Secure' : '';
}

function writeAuthCookie(name: string, value: string, maxAgeSeconds: number) {
  const suffix = authCookieSuffix();
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${suffix}`;
}

function clearAuthCookie(name: string) {
  const suffix = authCookieSuffix();
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${suffix}`;
}

export function setAccessToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  writeAuthCookie(TOKEN_KEY, token, 60 * 60 * 24 * 7);
  notifyAuthChanged();
}

export function setRefreshToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_KEY, token);
  notifyAuthChanged();
}

export function clearAccessToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  clearAuthCookie(TOKEN_KEY);
  notifyAuthChanged();
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

/** 401 시 refresh 1회 시도 후 재요청 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const run = (token: string | null) => {
    const headers = new Headers(init?.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };

  let res = await run(getAccessToken());
  if (res.status !== 401) return res;

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  const newToken = await refreshInFlight;
  if (!newToken) return res;
  return run(newToken);
}

export function buildAuthHeader(includeJson = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJson) headers['Content-Type'] = 'application/json';

  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

export function redirectToLogin(router: AppRouterInstance, nextPath: string) {
  router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
}

/** 로그인 후 이동 경로. `next`가 안전한 내부 경로면 우선, 없으면 역할별 기본 경로 */
export function getPostLoginRedirect(next: string | null | undefined, role?: string): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.includes('://')) {
    return next;
  }
  if (role === 'SUPER_ADMIN' || role === 'OPERATOR') {
    return '/admin/dashboard';
  }
  if (role === 'INSTRUCTOR') {
    return '/classroom/instructor/cms';
  }
  // 일반 회원: 마이페이지(기본). 강의실은 사이드바·수강 CTA에서 이동
  return '/mypage';
}

/**
 * 로그인·회원가입 직후 이동.
 * router.push만 쓰면 middleware가 accessToken 쿠키를 못 읽어 /login 으로 되돌아갈 수 있어
 * 전체 페이지 이동으로 쿠키·미들웨어를 확실히 맞춘다.
 */
export function applyPostLoginNavigation(path: string) {
  if (typeof window === 'undefined') return;
  window.location.assign(path);
}
