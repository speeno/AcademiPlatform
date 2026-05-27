function normalizeApiBase(raw?: string | null): string {
  const fallback = 'http://localhost:4400/api';
  let value = (raw ?? '').trim();
  if (!value) return fallback;

  if (value.startsWith('https//')) value = value.replace(/^https\/\//, 'https://');
  if (value.startsWith('http//')) value = value.replace(/^http\/\//, 'http://');
  if (!/^https?:\/\//.test(value)) value = `https://${value}`;
  return value.replace(/\/+$/, '');
}

/** Render Live Web Service (academiq-backend는 suspend될 수 있음) */
export const LIVE_RENDER_API_BASE = 'https://academiplatform.onrender.com/api';

const LEGACY_SUSPENDED_API_HOSTS = ['academiq-backend.onrender.com'];

function isLegacySuspendedApiBase(base: string): boolean {
  try {
    const host = new URL(base).hostname;
    return LEGACY_SUSPENDED_API_HOSTS.includes(host);
  } catch {
    return false;
  }
}

/** 명시 URL이 suspend된 legacy 호스트면 Live API로 대체 */
export function resolveApiBase(raw?: string | null): string {
  if (!raw?.trim()) return '';
  const normalized = normalizeApiBase(raw);
  if (isLegacySuspendedApiBase(normalized)) return LIVE_RENDER_API_BASE;
  return normalized;
}

function isLocalHost(hostname?: string): boolean {
  if (!hostname) return false;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

function getRuntimeApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit?.trim()) return resolveApiBase(explicit);

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (isLocalHost(host)) return 'http://localhost:4400/api';
    return LIVE_RENDER_API_BASE;
  }

  const renderExternal = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderExternal) return `${renderExternal.replace(/\/+$/, '')}/api`;
  return 'http://localhost:4400/api';
}

/** SSR·서버 컴포넌트용 API base (NEXT_PUBLIC_API_URL / RENDER_EXTERNAL_URL 우선) */
export function getServerApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit?.trim()) return resolveApiBase(explicit);

  const renderExternal = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderExternal) return `${renderExternal.replace(/\/+$/, '')}/api`;

  if (process.env.NODE_ENV === 'production') {
    return LIVE_RENDER_API_BASE;
  }
  return 'http://localhost:4400/api';
}

export const API_BASE = getRuntimeApiBase();
