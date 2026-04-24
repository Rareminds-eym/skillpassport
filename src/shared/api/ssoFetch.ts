import { ssoClient } from '@/features/auth/api/ssoAuthService';

export async function ssoFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  return ssoClient.fetch(input, init);
}

export async function ssoFetchJSON<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await ssoFetch(input, init);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}
