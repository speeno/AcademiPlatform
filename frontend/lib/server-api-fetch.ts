import { cookies } from 'next/headers';

/** SSR에서 accessToken 쿠키를 API Authorization 헤더로 전달 */
export async function getServerAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function fetchServerApi(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const authHeaders = await getServerAuthHeaders();
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(authHeaders)) {
    headers.set(key, value);
  }
  return fetch(url, { ...init, headers });
}
