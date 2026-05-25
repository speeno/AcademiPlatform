import { API_BASE, getServerApiBase } from '@/lib/api-base';

function getBackendOrigin(apiBase: string): string {
  return apiBase.replace(/\/api\/?$/, '');
}

function isHarnessCoverPath(url: string): boolean {
  return url.startsWith('/covers/harness-');
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

function usesLocalApi(apiBase: string): boolean {
  try {
    return isLocalHost(new URL(apiBase).hostname);
  } catch {
    return process.env.NODE_ENV !== 'production';
  }
}

/** Harness 표지: 로컬 API면 Next public, 원격 API면 백엔드 정적 경로 */
export function resolveCourseThumbnailUrl(
  url?: string | null,
  options?: { server?: boolean },
): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (!isHarnessCoverPath(url)) return url;

  const apiBase = options?.server ? getServerApiBase() : API_BASE;
  if (usesLocalApi(apiBase)) return url;

  return `${getBackendOrigin(apiBase)}${url}`;
}
