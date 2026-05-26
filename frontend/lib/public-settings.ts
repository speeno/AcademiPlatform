import { getServerApiBase } from '@/lib/api-base';

export async function fetchPublicSettings(keys: string[], revalidate = 30) {
  if (keys.length === 0) return {};
  const query = encodeURIComponent(keys.join(','));
  const res = await fetch(
    `${getServerApiBase()}/settings/public?keys=${query}`,
    { next: { revalidate } },
  );
  if (!res.ok) return {};
  const data = await res.json().catch(() => ({}));
  return data?.values && typeof data.values === 'object' ? data.values : {};
}
