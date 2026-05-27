/** SSR·일반 API (짧은 응답) */
export const DEFAULT_API_TIMEOUT_MS = 8000;

/** Render Free 콜드스타트·첫 DB 연결 대기 (클라이언트 목록 fetch) */
export const SLOW_API_TIMEOUT_MS = 90_000;

export async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
  timeoutMs = DEFAULT_API_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

