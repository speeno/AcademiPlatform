import { API_BASE, getServerApiBase } from '@/lib/api-base';
import { fetchWithAuth, getAccessToken } from '@/lib/auth';

type ApiFetchOptions = {
  server?: boolean;
};

function normalizeApiPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function joinApiUrl(base: string, path: string): string {
  return `${base}${normalizeApiPath(path)}`;
}

export function getApiUrl(path: string, options?: ApiFetchOptions): string {
  const isServer = options?.server ?? typeof window === 'undefined';
  const base = isServer ? getServerApiBase() : API_BASE;
  return joinApiUrl(base, path);
}

export function apiFetch(path: string, init?: RequestInit, options?: ApiFetchOptions): Promise<Response> {
  return fetch(getApiUrl(path, options), init);
}

export function apiFetchWithAuth(path: string, init?: RequestInit): Promise<Response> {
  return fetchWithAuth(getApiUrl(path, { server: false }), init);
}

/**
 * 응답 본문이 비어있거나(JSON 204/empty) 잘린 경우에도 안전하게 fallback을 반환한다.
 */
export async function parseJsonSafe<T>(response: Response, fallback: T): Promise<T> {
  const raw = await response.text();
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export { getAccessToken };
