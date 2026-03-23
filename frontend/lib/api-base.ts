function normalizeApiBase(raw?: string | null): string {
  const fallback = 'http://localhost:4400/api';
  let value = (raw ?? '').trim();
  if (!value) return fallback;

  if (value.startsWith('https//')) value = value.replace(/^https\/\//, 'https://');
  if (value.startsWith('http//')) value = value.replace(/^http\/\//, 'http://');
  if (!/^https?:\/\//.test(value)) value = `https://${value}`;
  return value.replace(/\/+$/, '');
}

function isLocalHost(hostname?: string): boolean {
  if (!hostname) return false;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

function getRuntimeApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit?.trim()) return normalizeApiBase(explicit);

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (isLocalHost(host)) return 'http://localhost:4400/api';
    return `${window.location.origin.replace(/\/+$/, '')}/api`;
  }

  const renderExternal = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderExternal) return `${renderExternal.replace(/\/+$/, '')}/api`;
  return 'http://localhost:4400/api';
}

export const API_BASE = getRuntimeApiBase();

