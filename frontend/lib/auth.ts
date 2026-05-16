import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const TOKEN_KEY = 'accessToken';
export const AUTH_CHANGED_EVENT = 'academiq:auth-changed';

function notifyAuthChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

/** 로그인/로그아웃 등 토큰 변경 시 UI 동기화용 구독 */
export function subscribeAuthState(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onAuthChanged = () => listener();
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY) listener();
  };

  window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.removeEventListener('storage', onStorage);
  };
}

export function setAccessToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  notifyAuthChanged();
}

export function clearAccessToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  notifyAuthChanged();
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
  return '/classroom';
}

